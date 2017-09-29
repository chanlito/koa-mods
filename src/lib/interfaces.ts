import * as Koa from 'koa';

export interface KoaModsOptions {
  app: Koa;
  controllers: any[];
  authCheckerFn?: (ctx: any) => Promise<{ success: boolean; user: any }>;
  roleCheckerFn?: (ctx: any) => Promise<{ availableRoles: string[] }>;
  enableCors?: boolean;
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
