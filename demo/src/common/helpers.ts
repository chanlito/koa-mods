import { Context } from 'koa';

export function setMetadata(ctx: Context, limit: number = 0, offset: number = 0, count: number = 0) {
  ctx.set({ 'X-Limit': `${limit}` });
  ctx.set({ 'X-Offset': `${offset}` });
  ctx.set({ 'X-Total-Count': `${count}` });
}
