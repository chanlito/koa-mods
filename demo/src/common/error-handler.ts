import { Context } from 'koa';

export function errorHandler() {
  return async (ctx: Context, next: () => Promise<any>) => {
    await next().catch(error => {
      console.error('Oops, caught an error!', error);
      error.headers = undefined;
      ctx.set('X-Message', error.message);

      switch (error.name) {
        case 'BadRequestError':
          ctx.status = 400;
          ctx.body = error;
          break;
        case 'NotFoundError':
          ctx.status = 404;
          ctx.body = error;
          break;
        case 'UnauthenticatedError':
          ctx.status = 401;
          ctx.body = error;
          break;
        case 'UnauthorizedError':
          ctx.status = 403;
          ctx.body = error;
          break;
        case 'KoaModsValidationError':
          ctx.status = 422;
          ctx.body = error;
          break;
        default: {
          const name = 'InternalServerError';
          const message = 'Internal Server Error';
          ctx.set('X-Message', error.message || message);
          ctx.status = 500;
          ctx.body = { name, message: error.message || message };
        }
      }
    });
  };
}
