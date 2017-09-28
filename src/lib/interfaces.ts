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
