import * as cors from 'kcors';
import * as Koa from 'koa';
import * as bodyparser from 'koa-bodyparser';
import * as Router from 'koa-router';

import { KoaModsOptions } from '../';
import { METADATA_AUTHENTICATION, METADATA_ROUTES } from './constants';

export function useKoaMods(options: KoaModsOptions): any {
  const { app, controllers, authCheckerFn, roleCheckerFn, enableCors } = options;

  if (enableCors) app.use(cors());
  app.use(bodyparser());

  const router = new Router();

  for (const ctrl of controllers) {
    const routes = Reflect.getMetadata(METADATA_ROUTES, ctrl);
    for (const route of routes) {
      const { method, url, name, params } = route;
      let { middleware } = route;

      const authFnMws: { type: 'required' | 'optional'; roles: string[] } | undefined = Reflect.getMetadata(
        METADATA_AUTHENTICATION,
        ctrl.prototype,
        name
      );

      let am;
      let rm;

      if (authCheckerFn && authFnMws && authFnMws.type === 'required') {
        am = async (ctx: any, next: () => Promise<any>) => {
          const authResult = await authCheckerFn(ctx);

          if (authResult.success) {
            ctx.state.authUser = authResult.user;
            return next();
          }

          ctx.status = 401;
          ctx.body = {
            message: 'Unauthenticated'
          };
        };
      } else if (authCheckerFn && authFnMws && authFnMws.type === 'optional') {
        am = async (ctx: Koa.Context, next: () => Promise<any>) => {
          const authResult = await authCheckerFn(ctx);
          if (authResult.success) ctx.state.authUser = authResult.user;
          return next();
        };
      }

      if (roleCheckerFn && authFnMws && authFnMws.roles && authFnMws.roles.length) {
        rm = async (ctx: Koa.Context, next: () => Promise<any>) => {
          if (ctx.state.authUser) {
            const roleCheckResult = await roleCheckerFn(ctx);
            const foundAvailRole = roleCheckResult.availableRoles.some(r => authFnMws.roles.indexOf(r) >= 0);
            const foundUserRole = authFnMws.roles.some(r => ctx.state.authUser.role === r);
            if (foundAvailRole && foundUserRole) {
              return next();
            } else {
              ctx.status = 403;
              ctx.body = {
                message: 'Unauthorized'
              };
            }
          } else {
            return next();
          }
        };
        if (am && rm) middleware = [ am, rm, ...middleware ];
      } else {
        if (am) middleware = [ am, ...middleware ];
      }

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
