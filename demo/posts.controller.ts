import { Body, Controller, Get, Param, Params, Patch, Post, QueryParam, QueryParams, Route, Use } from '../src';
import { CreatePostDto, CreatePostDtoQuery } from './posts.dto';

const middleware1 = async (ctx: any, next: any) => {
  console.log('MID 1');
  await next();
};

const middleware2 = async (ctx: any, next: any) => {
  console.log('MID 2');
  await next();
};

@Controller('posts')
export // @Use(sleepMiddleware, sleepMiddlewareAlt)
class PostController {
  @Route('GET')
  async fetchPosts(
    @QueryParam('order') order: string,
    @QueryParam('limit') limit: number,
    @QueryParam('offset') offset: number
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
  @Use(middleware1, middleware2)
  async createPost(
    @Params() params: CreatePostDto,
    @Body() body: CreatePostDto,
    @Body() body2: CreatePostDto,
    @QueryParams() query: CreatePostDtoQuery
  ) {}
}
