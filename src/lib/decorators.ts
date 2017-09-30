import { extend, Messages, validateAll } from 'indicative';
import { Context } from 'koa';

import { RouteDefinition, ValidateOptions } from '../';
import {
  ACTION_TYPES,
  AUTH_META_KEY,
  MWS_META_KEY,
  MWS_VAL_META_KEY,
  PARAMS_META_KEY,
  ROUTES_META_KEY,
  VALIDATION_META_KEY,
} from '../lib/constants';
import { CustomValidateOptions } from './interfaces';

export function Controller(path: string = ''): ClassDecorator {
  if (path.charAt(0) !== '/') path = `/${path}`;

  return target => {
    const targetPrototype = target.prototype;
    const middlewares = Reflect.getMetadata(MWS_META_KEY, target) || [];
    const routeDefinitions = Reflect.getMetadata(ROUTES_META_KEY, targetPrototype) || [];
    const routes: RouteDefinition[] = [];

    for (const route of routeDefinitions) {
      const { method, name } = route as { method: string; path: string; name: string };

      const fnMws = Reflect.getMetadata(`${MWS_META_KEY}_${name}`, targetPrototype) || [];
      const fnValMws = Reflect.getMetadata(`${MWS_VAL_META_KEY}_${name}`, targetPrototype) || [];
      const params = Reflect.getMetadata(`${PARAMS_META_KEY}_${name}`, targetPrototype) || [];

      routes.push({
        method,
        url: path + route.path,
        middleware: [ ...middlewares, ...fnMws, ...fnValMws.reverse() ],
        name: route.name,
        params
      });
    }

    Reflect.defineMetadata(ROUTES_META_KEY, routes, target);
  };
}

export function Use(...middlewares: ((ctx: Context, next: any) => Promise<any>)[]): Function {
  return (target: any, name: string) => {
    if (name) {
      let fnMws = Reflect.getMetadata(`${MWS_META_KEY}_${name}`, target) || [];
      fnMws = [ ...middlewares, ...fnMws ];
      Reflect.defineMetadata(`${MWS_META_KEY}_${name}`, fnMws, target);
    } else {
      Reflect.defineMetadata(MWS_META_KEY, middlewares, target);
    }
  };
}

export function Route(method: string, path: string = ''): MethodDecorator {
  const methodLowercased = method.toLocaleLowerCase();

  if (!Object.keys(ACTION_TYPES).find(key => ACTION_TYPES[key] === methodLowercased)) {
    throw new Error(`Invalid method "${method}" used in @Route().`);
  }

  return (target: any, name: string) => {
    const meta = Reflect.getMetadata(ROUTES_META_KEY, target) || [];
    meta.push({ method: methodLowercased, path: path.charAt(0) !== '/' ? `/${path}` : path, name });
    Reflect.defineMetadata(ROUTES_META_KEY, meta, target);
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
    const meta = Reflect.getMetadata(`${PARAMS_META_KEY}_${name}`, target) || [];
    meta.push({ index, name, fn });
    Reflect.defineMetadata(`${PARAMS_META_KEY}_${name}`, meta, target);
  };
}

export function Ctx() {
  return Inject((ctx: Context) => ctx);
}

export function Req() {
  return Inject((ctx: Context) => ctx.req);
}

export function Request() {
  return Inject((ctx: Context) => ctx.request);
}

export function Res() {
  return Inject((ctx: Context) => ctx.res);
}

export function Response() {
  return Inject((ctx: Context) => ctx.response);
}

export function State(prop?: string) {
  return Inject((ctx: Context) => {
    return prop ? ctx.state[prop] : ctx.state;
  });
}

export function Body(): ParameterDecorator {
  return (target: any, name: string, index: number) => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    const pt = paramTypes[index];

    const validateOptions: ValidateOptions | undefined = Reflect.getMetadata(VALIDATION_META_KEY, pt);
    if (validateOptions) {
      const valMw = createValidationMiddleware(validateOptions, 'body');
      let middlewares = Reflect.getMetadata(`${MWS_VAL_META_KEY}_${name}`, target) || [];
      middlewares = [ ...middlewares, valMw ];
      Reflect.defineMetadata(`${MWS_VAL_META_KEY}${name ? `_${name}` : ''}`, middlewares, target);
    }

    const meta = Reflect.getMetadata(`${PARAMS_META_KEY}_${name}`, target) || [];
    meta.push({ index, name, fn: (ctx: Context) => ctx.request.body });
    Reflect.defineMetadata(`${PARAMS_META_KEY}_${name}`, meta, target);
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

    const meta = Reflect.getMetadata(`${PARAMS_META_KEY}_${name}`, target) || [];

    const fn = (ctx: Context) => {
      if (paramType === 'Number') {
        return ctx.query[prop] ? +ctx.query[prop] : ctx.query[prop];
      } else {
        return ctx.query[prop];
      }
    };

    meta.push({ index, name, fn });
    Reflect.defineMetadata(`${PARAMS_META_KEY}_${name}`, meta, target);
  };
}

export function QueryParams(): ParameterDecorator {
  return (target: any, name: string, index: number) => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    const pt = paramTypes[index];

    const validateOptions: ValidateOptions | undefined = Reflect.getMetadata(VALIDATION_META_KEY, pt);
    if (validateOptions) {
      const valMw = createValidationMiddleware(validateOptions, 'query');
      let middlewares = Reflect.getMetadata(`${MWS_VAL_META_KEY}_${name}`, target) || [];
      middlewares = [ ...middlewares, valMw ];
      Reflect.defineMetadata(`${MWS_VAL_META_KEY}${name ? `_${name}` : ''}`, middlewares, target);
    }

    const meta = Reflect.getMetadata(`${PARAMS_META_KEY}_${name}`, target) || [];
    meta.push({ index, name, fn: (ctx: Context) => ctx.query });
    Reflect.defineMetadata(`${PARAMS_META_KEY}_${name}`, meta, target);
  };
}

export function Param(prop: string): ParameterDecorator {
  return (target: any, name: string, index: number) => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    const paramType = paramTypes[index].name;

    const meta = Reflect.getMetadata(`${PARAMS_META_KEY}_${name}`, target) || [];

    const fn = (ctx: Context) => {
      if (paramType === 'Number') {
        return ctx.params[prop] ? +ctx.params[prop] : ctx.params[prop];
      } else {
        return ctx.params[prop];
      }
    };

    meta.push({ index, name, fn });
    Reflect.defineMetadata(`${PARAMS_META_KEY}_${name}`, meta, target);
  };
}

export function Params(): ParameterDecorator {
  return (target: any, name: string, index: number) => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    const pt = paramTypes[index];

    const validateOptions: ValidateOptions | undefined = Reflect.getMetadata(VALIDATION_META_KEY, pt);
    if (validateOptions) {
      const valMw = createValidationMiddleware(validateOptions, 'params');
      let middlewares = Reflect.getMetadata(`${MWS_VAL_META_KEY}_${name}`, target) || [];
      middlewares = [ ...middlewares, valMw ];
      Reflect.defineMetadata(`${MWS_VAL_META_KEY}${name ? `_${name}` : ''}`, middlewares, target);
    }

    const meta = Reflect.getMetadata(`${PARAMS_META_KEY}_${name}`, target) || [];
    meta.push({ index, name, fn: (ctx: Context) => ctx.params });
    Reflect.defineMetadata(`${PARAMS_META_KEY}_${name}`, meta, target);
  };
}

export function Validate(options: ValidateOptions): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(VALIDATION_META_KEY, options, target);
  };
}

export function Auth(...roles: string[]): MethodDecorator {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata(AUTH_META_KEY, { type: 'required', roles }, target, propertyKey);
  };
}

export function AuthOpt(...roles: string[]): MethodDecorator {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata(AUTH_META_KEY, { type: 'optional', roles }, target, propertyKey);
  };
}

export function AuthUser() {
  return Inject((ctx: Context) => ctx.state.authUser);
}

function createValidationMiddleware(validateOptions: ValidateOptions, type: 'body' | 'params' | 'query') {
  return async (ctx: Context, next: () => Promise<any>): Promise<any> => {
    const customOptions: CustomValidateOptions | undefined = (ctx as any).koaModsCustomValidationOptions;
    const { rules: currentRules, messages: currentMessages } = validateOptions;
    let data = {};
    let customMessages: Messages = currentMessages ? { ...currentMessages } : {};

    if (type === 'body') {
      data = ctx.request.body;
    } else if (type === 'query') {
      data = ctx.query;
    } else {
      data = ctx.params;
    }

    if (customOptions) {
      const { rules, messages } = customOptions;
      if (rules) {
        for (const r of rules) {
          if (typeof r === 'function') {
            extend(r.name, r);
          } else {
            for (const key in r) {
              if (r.hasOwnProperty(key)) {
                extend(key, r[key]);
              }
            }
          }
        }
      }
      if (messages) {
        customMessages = { ...messages, ...customMessages };
      }
    }
    try {
      await validateAll(data, currentRules, customMessages);
      return next();
    } catch (errors) {
      const e: any = new Error();
      e.name = 'KoaModsValidationError';
      e.message = `Validation failed, Unable to process the request ${type}.`;
      e.errors = errors;
      throw e;
    }
  };
}
