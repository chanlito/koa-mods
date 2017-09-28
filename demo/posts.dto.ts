import { Validate } from '../src';

@Validate({
  rules: {
    title: 'required|string',
    content: 'required|string|max:500',
    date: 'required',
    album: 'required|object',
    'album.title': 'required',
    'album.author': 'required'
  },
  messages: {
    'title.required': 'What the faq bro?'
  }
})
export class CreatePostDto {
  readonly title: string;
  readonly content: string;
  readonly date: Date;
  readonly album: Album;
}

export class CreatePostDtoAlt {
  readonly title: string;
  readonly content: string;
  readonly date: Date;
  readonly album: Album;
}

@Validate({
  rules: {
    category: 'required|string'
  }
})
export class CreatePostDtoQuery {
  readonly category: string;
}

export interface Album {
  title: string;
  author: string;
}
