import { verify } from 'jsonwebtoken';
import { Context } from 'koa';

import User from '../models/user.model';
import { UnauthorizedError } from './';
import { UnauthenticatedError } from './errors';

export async function authorizationChecker(
  ctx: Context,
  access: { type: 'required' | 'optional'; roles: string[] }
): Promise<any> {
  const { authorization } = ctx.headers;
  if (access.type === 'required' && !authorization) {
    throw new UnauthenticatedError('Access token is missing.');
  }

  let user: User | null = null;
  try {
    const { id, username } = verify(authorization, 'Koa-Mods-Secret') as { id: number; username: string };
    user = await User.find<User>({ where: { id, username } });
  } catch (error) {
    if (access.type === 'required') throw new UnauthenticatedError(error.message);
  }

  if (access.type === 'required' && !user) throw new UnauthenticatedError('User was not found or no longer exists.');
  if (user && access.roles.length && !access.roles.some(r => user!.role === r))
    throw new UnauthorizedError('Access denied, access to the requested resource is not allowed.');

  return user;
}
