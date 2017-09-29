import * as Koa from 'koa';

export interface KoaModsOptions {
  app: Koa;
  controllers: any[];
  enableCors?: boolean;
  authorizationChecker: AuthorizationCheckerFn;
}

export interface RouteDefinition {
  method: string;
  url: string;
  middleware: any[];
  name: string;
  params: any[];
}

export interface ValidateOptions {
  rules: { [x: string]: string };
  messages?: { [x: string]: string };
}

export type AuthorizationCheckerFn = (
  ctx: Koa.Context,
  access: { type: 'required' | 'optional'; roles: string[] }
) => Promise<void>;
