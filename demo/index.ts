import 'reflect-metadata';

import * as Koa from 'koa';
import * as bodyparser from 'koa-bodyparser';
import * as Router from 'koa-router';

import { bindControllers } from '../src';
import { PostController } from './posts.controller';
import { UsersController } from './users.controller';

const app = new Koa();
const router = new Router();

// Error handler
app.use(async (ctx, next) => {
  await next().catch(error => {
    console.error(error);
  });
});
app.use(bodyparser());

bindControllers(router, [ PostController, UsersController ]);

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3030, () => console.log('Server running on port 3030'));
