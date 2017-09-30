import 'reflect-metadata';

import * as Koa from 'koa';
import * as logger from 'koa-logger';

import { useKoaMods } from '../../dist';
import { AuthController } from './api/auth/auth.controller';
import { TodosController } from './api/todos/todos.controller';
import { sequelize } from './common';
import { authorizationChecker } from './common/access-control';
import { validationCustomMessages } from './common/custom-messages';
import { validationCustomRules } from './common/custom-rules';
import { errorHandler } from './common/error-handler';

const app = new Koa();

app.use(logger());
app.use(errorHandler());

useKoaMods({
  app,
  controllers: [ AuthController, TodosController ],
  authorizationChecker,
  customValidateOptions: {
    rules: validationCustomRules,
    messages: validationCustomMessages
  }
});

(async () => {
  await sequelize.sync({ force: false });
  app.listen(6969, () => console.log('Server running on port 6969'));
})().catch(e => {
  console.error(e);
  process.exit(1);
});
