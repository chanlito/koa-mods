import { resolve as pathResolve } from 'path';
import { Sequelize } from 'sequelize-typescript';

export const sequelize = new Sequelize({
  host: 'localhost',
  port: 3306,
  name: 'koa-mods',
  username: 'root',
  password: '',
  dialect: 'mysql',
  modelPaths: [ pathResolve(__dirname, '../models') ],
  logging: false
});
