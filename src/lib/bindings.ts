import * as debug from 'debug';
import { Glob } from 'glob';
import * as Koa from 'koa';
import * as bodyparser from 'koa-bodyparser';
import * as Router from 'koa-router';

import { KoaModsOptions } from '../';
import { AUTH_META_KEY, ROUTES_META_KEY } from './constants';

export function useKoaMods(options: KoaModsOptions): any {
  const log = debug('koa-mods');
  const { app, authorizationChecker, customValidateOptions } = options;
  let { controllers } = options;

  app.use(bodyparser());

  const router = new Router();

  if (controllers.length === 1) {
    const files = new Glob(controllers[0], { sync: true });
    log('found the following controller files: \n', files.found);
    controllers = files.found.map(f => {
      const ctrlObj = require(f);
      for (const prop in ctrlObj) {
        if (ctrlObj.hasOwnProperty(prop)) {
          return ctrlObj[prop];
        }
      }
    });
  }
  log('controllers', controllers);

  for (const ctrl of controllers) {
    const customValMw = async (ctx: any, next: () => Promise<any>) => {
      ctx.koaModsCustomValidationOptions = customValidateOptions;
      return next();
    };

    try {
      const routes = Reflect.getMetadata(ROUTES_META_KEY, ctrl);
      if (routes) {
        for (const route of routes) {
          const { method, url, name, params } = route;
          let { middleware } = route;

          middleware = [ customValMw, ...middleware ];

          const authFnMws: { type: 'required' | 'optional'; roles: string[] } | undefined = Reflect.getMetadata(
            AUTH_META_KEY,
            ctrl.prototype,
            name
          );

          if (authorizationChecker && authFnMws) {
            const am = async (ctx: Koa.Context, next: () => Promise<any>) => {
              ctx.state.authUser = await authorizationChecker(ctx, authFnMws);
              return next();
            };
            middleware = [ am, ...middleware ];
          }

          log(
            `${authFnMws && authFnMws.type === 'required'
              ? '🛡️ '
              : authFnMws && authFnMws.type === 'optional' ? '🛡️* ' : ' '}routes:`,
            (method as string).toUpperCase(),
            url,
            '-->',
            name
          );
          router[method](url, ...middleware, async function(ctx: Koa.Context, next: () => Promise<any>) {
            const inst = new ctrl();
            const args = getArguments(params, ctx, next);
            const result = inst[name](...args);
            if (result) ctx.body = await result;
            return result;
          });
        }
      }
    } catch (error) {
      throw new Error('Invalid controllers provided.');
    }
  }

  app.use(router.routes());
  app.use(router.allowedMethods());
}

function getArguments(params: any[], ctx: any, next: () => Promise<any>): any[] {
  let args = [ ctx, next ];

  if (params) {
    args = [];
    params.sort((a, b) => a.index - b.index);
    for (const param of params) {
      if (param) args.push(param.fn(ctx));
    }
  }

  return args;
}
