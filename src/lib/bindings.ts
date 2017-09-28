import { METADATA_ROUTES } from './constants';

export function bindControllers(router: any, controllers: any[]): any {
  for (const ctrl of controllers) {
    const routes = Reflect.getMetadata(METADATA_ROUTES, ctrl);

    for (const { method, url, middleware, name, params } of routes) {
      router[method](url, ...middleware, async function(ctx: any, next: () => Promise<any>) {
        const inst = new ctrl();
        const args = getArguments(params, ctx, next);
        const result = inst[name](...args);
        if (result) ctx.body = await result;
        return result;
      });
    }
  }

  return router;
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
