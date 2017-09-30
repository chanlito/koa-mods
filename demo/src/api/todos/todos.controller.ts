import { Context } from 'koa';

import {
  Auth,
  AuthUser,
  Body,
  Controller,
  Ctx,
  Delete,
  Get,
  Post,
  Put,
  QueryParam,
  State,
  Use,
} from '../../../../dist';
import { setMetadata } from '../../common';
import { default as Todo, TodoAttributesOpt } from '../../models/todo.model';
import User from '../../models/user.model';
import { CreateTodoDto, UpdateTodoDto } from './todos.dto';
import { findTodo } from './todos.middleware';

@Controller('todos')
export class TodosController {
  @Auth('User')
  @Post()
  async createTodo(@AuthUser() authUser: User, @Body() body: CreateTodoDto) {
    return Todo.create<Todo, TodoAttributesOpt>({
      title: body.title,
      description: body.description,
      userId: authUser.id
    });
  }

  @Auth()
  @Get()
  async listTodos(
    @AuthUser() authUser: User,
    @Ctx() ctx: Context,
    @QueryParam('limit') limit: number = 10,
    @QueryParam('offset') offset: number = 0
  ) {
    const { rows, count } = await Todo.findAndCount<Todo>({
      attributes: { exclude: [ 'userId' ] },
      where: { userId: authUser.id },
      limit,
      offset
    });
    setMetadata(ctx, limit, offset, count);
    return rows;
  }

  @Auth()
  @Get(':id')
  @Use(findTodo)
  async showTodo(@State('todo') todo: Todo) {
    return todo;
  }

  @Auth()
  @Put(':id')
  @Use(findTodo)
  async updateTodo(@Body() body: UpdateTodoDto, @State('todo') todo: Todo) {
    todo.title = body.title || todo.title;
    todo.description = body.description || todo.description;
    await todo.save();
    return todo;
  }

  @Auth()
  @Delete(':id')
  @Use(findTodo)
  async deleteTodo(@State('todo') todo: Todo) {
    await todo.destroy();
  }
}
