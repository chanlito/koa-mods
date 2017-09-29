import 'reflect-metadata';

import * as Koa from 'koa';
import * as bodyparser from 'koa-bodyparser';

import { useKoaMods } from '../src';
import { PostController } from './posts/posts.controller';
import { UsersController } from './users.controller';

const app = new Koa();

// Error handler
app.use(async (ctx, next) => {
  await next().catch(error => {
    console.error(error);

    if (error.name === 'KoaModsValidationError') {
      ctx.status = 422;
      ctx.body = error;
    } else {
      ctx.status = 500;
      ctx.body = { message: 'Internal Server Error' };
    }
  });
});
app.use(bodyparser());

useKoaMods({
  app,
  controllers: [ PostController, UsersController ],
  authCheckerFn,
  roleCheckerFn
});

app.listen(3030, () => console.log('Server running on port 3030'));

async function authCheckerFn(ctx: Koa.Context): Promise<{ success: boolean; user: any }> {
  const { username, password } = ctx.headers;
  if (username === 'bruce' && password === 'easypass') {
    return { success: true, user: { username, password, role: 'USER' } };
  } else {
    return { success: false, user: undefined };
  }
}

async function roleCheckerFn(ctx: Koa.Context): Promise<{ availableRoles: string[] }> {
  return { availableRoles: [ 'ADMIN', 'USER' ] };
}
