import * as debug from 'debug';
import * as Koa from 'koa';
import * as bodyparser from 'koa-bodyparser';
import * as Router from 'koa-router';

import { KoaModsOptions } from '../';
import { AUTH_META_KEY, ROUTES_META_KEY } from './constants';

export function useKoaMods(options: KoaModsOptions): any {
  const log = debug('koa-mods');
  const { app, controllers, authorizationChecker, customValidateOptions } = options;

  app.use(bodyparser());

  const router = new Router();

  for (const ctrl of controllers) {
    const customValMw = async (ctx: any, next: () => Promise<any>) => {
      ctx.koaModsCustomValidationOptions = customValidateOptions;
      return next();
    };

    const routes = Reflect.getMetadata(ROUTES_META_KEY, ctrl);
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

      log('routes:', (method as string).toUpperCase(), url, '-->', name);
      router[method](url, ...middleware, async function(ctx: Koa.Context, next: () => Promise<any>) {
        const inst = new ctrl();
        const args = getArguments(params, ctx, next);
        const result = inst[name](...args);
        if (result) ctx.body = await result;
        return result;
      });
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
