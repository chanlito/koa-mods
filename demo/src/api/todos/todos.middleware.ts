import { Context } from 'koa';

import { NotFoundError } from '../../common';
import Todo from '../../models/todo.model';

export async function findTodo(ctx: Context, next: () => Promise<any>) {
  const { params: { id }, state: { authUser } } = ctx;
  const todo = await Todo.find<Todo>({
    where: { userId: authUser.id }
  });
  if (!todo) throw new NotFoundError('Requested todo was not found.');
  ctx.state.todo = todo;
  await next();
}
