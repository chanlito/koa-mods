import { Messages, ValidationMethod } from 'indicative';
import * as Koa from 'koa';

export interface KoaModsOptions {
  app: Koa;
  controllers: any[];
  authorizationChecker?: AuthorizationCheckerFn;
  customValidateOptions?: CustomValidateOptions;
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
  messages?: Messages;
}

export interface CustomValidateOptions {
  rules?: (ValidationMethod | { [x: string]: ValidationMethod })[];
  messages?: Messages;
}

export type AuthorizationCheckerFn = (
  ctx: Koa.Context,
  access: { type: 'required' | 'optional'; roles: string[] }
) => Promise<void>;
