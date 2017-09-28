import { validateAll } from 'indicative';

import { RouteDefinition, ValidateOptions } from '../';
import { ACTION_TYPES, METADATA_MIDDLEWARES, METADATA_PARAMS, METADATA_ROUTES, METADATA_RULES } from '../';

export function Controller(path: string = ''): ClassDecorator {
  if (path.charAt(0) !== '/') path = `/${path}`;

  return target => {
    const targetPrototype = target.prototype;
    const middlewares = Reflect.getMetadata(METADATA_MIDDLEWARES, target) || [];
    const routeDefinitions = Reflect.getMetadata(METADATA_ROUTES, targetPrototype) || [];
    const routes: RouteDefinition[] = [];

    for (const route of routeDefinitions) {
      const { method, name } = route as { method: string; path: string; name: string };

      const fnMws = Reflect.getMetadata(`${METADATA_MIDDLEWARES}_${name}`, targetPrototype) || [];
      const params = Reflect.getMetadata(`${METADATA_PARAMS}_${name}`, targetPrototype) || [];

      routes.push({
        method,
        url: path + route.path,
        middleware: [ ...middlewares, ...fnMws ],
        name: route.name,
        params
      });
    }

    Reflect.defineMetadata(METADATA_ROUTES, routes, target);
  };
}

export function Use(...middlewares: ((ctx: any, next: any) => Promise<any>)[]): Function {
  return (target: any, name: string) => {
    if (name) {
      let fnMws = Reflect.getMetadata(`${METADATA_MIDDLEWARES}_${name}`, target) || [];
      fnMws = [ ...middlewares, ...fnMws.reverse() ];
      Reflect.defineMetadata(`${METADATA_MIDDLEWARES}_${name}`, fnMws, target);
    } else {
      Reflect.defineMetadata(METADATA_MIDDLEWARES, middlewares, target);
    }
  };
}

export function Route(method: string, path: string = ''): MethodDecorator {
  const methodLowercased = method.toLocaleLowerCase();

  if (!Object.keys(ACTION_TYPES).find(key => ACTION_TYPES[key] === methodLowercased)) {
    throw new Error(`Invalid method "${method}" used in @Route().`);
  }

  return (target: any, name: string) => {
    const meta = Reflect.getMetadata(METADATA_ROUTES, target) || [];
    meta.push({ method: methodLowercased, path, name });
    Reflect.defineMetadata(METADATA_ROUTES, meta, target);
  };
}

export function Get(path?: string) {
  return Route(ACTION_TYPES.GET, path);
}

export function Post(path?: string) {
  return Route(ACTION_TYPES.POST, path);
}

export function Put(path?: string) {
  return Route(ACTION_TYPES.PUT, path);
}

export function Patch(path?: string) {
  return Route(ACTION_TYPES.PATCH, path);
}

export function Delete(path?: string) {
  return Route(ACTION_TYPES.DELETE, path);
}

export function Inject(fn: any) {
  return function(target: any, name: string, index: number) {
    const meta = Reflect.getMetadata(`${METADATA_PARAMS}_${name}`, target) || [];
    meta.push({ index, name, fn });
    Reflect.defineMetadata(`${METADATA_PARAMS}_${name}`, meta, target);
  };
}

export function Ctx() {
  return Inject((ctx: any) => ctx);
}

export function Req() {
  return Inject((ctx: any) => ctx.req);
}

export function Request() {
  return Inject((ctx: any) => ctx.request);
}

export function Res() {
  return Inject((ctx: any) => ctx.res);
}

export function Response() {
  return Inject((ctx: any) => ctx.response);
}

export function Body() {
  return (target: any, name: string, index: number) => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    const pt = paramTypes[index];

    const validationOptions: ValidateOptions = Reflect.getMetadata(METADATA_RULES, pt);
    if (validationOptions) {
      const valMw = createValidationMiddleware(validationOptions, 'body');
      let middlewares = Reflect.getMetadata(`${METADATA_MIDDLEWARES}_${name}`, target) || [];
      middlewares = [ ...middlewares, valMw ];
      Reflect.defineMetadata(`${METADATA_MIDDLEWARES}${name ? `_${name}` : ''}`, middlewares, target);
    }

    const meta = Reflect.getMetadata(`${METADATA_PARAMS}_${name}`, target) || [];
    meta.push({ index, name, fn: (ctx: any) => ctx.request.body });
    Reflect.defineMetadata(`${METADATA_PARAMS}_${name}`, meta, target);
  };
}

export function File() {
  return Inject((ctx: any) => {
    if (ctx.request.files.length) return ctx.request.files[0];
    return ctx.request.files;
  });
}

export function Files() {
  return Inject((ctx: any) => ctx.request.files);
}

export function QueryParam(prop: string) {
  return (target: any, name: string, index: number) => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    const paramType = paramTypes[index].name;

    const meta = Reflect.getMetadata(`${METADATA_PARAMS}_${name}`, target) || [];

    const fn = (ctx: any) => {
      if (paramType === 'Number') {
        return ctx.query[prop] ? +ctx.query[prop] : ctx.query[prop];
      } else {
        return ctx.query[prop];
      }
    };

    meta.push({ index, name, fn });
    Reflect.defineMetadata(`${METADATA_PARAMS}_${name}`, meta, target);
  };
}

export function QueryParams() {
  return (target: any, name: string, index: number) => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    const pt = paramTypes[index];

    const validationOptions: ValidateOptions = Reflect.getMetadata(METADATA_RULES, pt);
    if (validationOptions) {
      const valMw = createValidationMiddleware(validationOptions, 'query');
      let middlewares = Reflect.getMetadata(`${METADATA_MIDDLEWARES}_${name}`, target) || [];
      middlewares = [ ...middlewares, valMw ];
      Reflect.defineMetadata(`${METADATA_MIDDLEWARES}${name ? `_${name}` : ''}`, middlewares, target);
    }

    const meta = Reflect.getMetadata(`${METADATA_PARAMS}_${name}`, target) || [];
    meta.push({ index, name, fn: (ctx: any) => ctx.query });
    Reflect.defineMetadata(`${METADATA_PARAMS}_${name}`, meta, target);
  };
}

export function Param(prop: string): ParameterDecorator {
  return (target: any, name: string, index: number) => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    const paramType = paramTypes[index].name;

    const meta = Reflect.getMetadata(`${METADATA_PARAMS}_${name}`, target) || [];

    const fn = (ctx: any) => {
      if (paramType === 'Number') {
        return ctx.params[prop] ? +ctx.params[prop] : ctx.params[prop];
      } else {
        return ctx.params[prop];
      }
    };

    meta.push({ index, name, fn });
    Reflect.defineMetadata(`${METADATA_PARAMS}_${name}`, meta, target);
  };
}

export function Params(): ParameterDecorator {
  return (target: any, name: string, index: number) => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    const pt = paramTypes[index];

    const validationOptions: ValidateOptions = Reflect.getMetadata(METADATA_RULES, pt);
    if (validationOptions) {
      const valMw = createValidationMiddleware(validationOptions, 'params');
      let middlewares = Reflect.getMetadata(`${METADATA_MIDDLEWARES}_${name}`, target) || [];
      middlewares = [ ...middlewares, valMw ];
      Reflect.defineMetadata(`${METADATA_MIDDLEWARES}${name ? `_${name}` : ''}`, middlewares, target);
    }

    const meta = Reflect.getMetadata(`${METADATA_PARAMS}_${name}`, target) || [];
    meta.push({ index, name, fn: (ctx: any) => ctx.params });
    Reflect.defineMetadata(`${METADATA_PARAMS}_${name}`, meta, target);
  };
}

export function Validate(options: ValidateOptions): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(METADATA_RULES, options, target);
  };
}

function createValidationMiddleware(validationOptions, type: 'body' | 'params' | 'query') {
  const valMw = async (ctx: any, next: () => Promise<any>): Promise<any> => {
    try {
      let data = {};

      if (type === 'body') {
        data = ctx.request.body;
      } else if (type === 'query') {
        data = ctx.query;
      } else if (type === 'params') {
        data = ctx.params;
      } else {
        throw new Error('Invalid Type');
      }

      await validateAll(data, validationOptions.rules, validationOptions.messages);
      await next();
    } catch (errors) {
      const e: any = new Error();
      e.name = 'KoaModsValidationError';
      e.message = `Validation failed, Unable to process the request ${type}.`;
      e.errors = errors;
      throw e;
    }
  };
  return valMw;
}
