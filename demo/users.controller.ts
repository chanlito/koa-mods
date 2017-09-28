import { Controller, Get } from '../src';

@Controller('users')
export class UsersController {
  @Get()
  async findUsers() {}
}
