import {
  Auth,
  AuthUser,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  QueryParam,
  QueryParams,
  Route,
  Use,
} from '../../src';
import { CreatePostDto, CreatePostDtoQuery } from './posts.dto';
import { sleepMiddleware, sleepMiddlewareAlt } from './posts.middleware';

@Controller('posts')
@Use(sleepMiddleware)
export class PostController {
  @Route('GET')
  async fetchPosts(
    @QueryParam('order') order: string,
    @QueryParam('limit') limit: number,
    @QueryParam('offset') offset: number,
    @QueryParams() query: CreatePostDtoQuery
  ) {
    return [
      {
        id: 1,
        post: 'A'
      },
      {
        id: 2,
        post: 'b'
      },
      {
        order: `typeof ${typeof order} value ${order}`,
        limit: `typeof ${typeof limit} value ${limit}`,
        offset: `typeof ${typeof offset} value ${offset}`
      }
    ];
  }

  @Get('/:id')
  async fetchPost(@Param('id') id: string) {
    console.log('id', id);
    return {
      id,
      post: 'C'
    };
  }

  @Get('/:postId/comments/:commentId')
  async fetchPostWithComments(
    @Param('id') id: string,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number
  ) {
    return {
      id,
      postId,
      commentId,
      types: [ typeof id, typeof postId, typeof commentId ],
      post: 'C'
    };
  }

  @Patch('/:id')
  async patchPost(@Param('id') id: number) {
    console.log('typeof id', typeof id);
    return {
      id,
      post: 'C'
    };
  }

  @Post()
  @Auth()
  // @AuthOpt('ADMIN', 'USER')
  @Use(sleepMiddleware, sleepMiddlewareAlt)
  async createPost(@Body() body: CreatePostDto, @AuthUser() authUser: any) {
    return authUser;
  }
}
