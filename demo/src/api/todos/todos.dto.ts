import { Validate } from '../../../../dist';

@Validate({
  rules: {
    title: 'required|string|max:100',
    description: 'string'
  }
})
export class CreateTodoDto {
  readonly title: string;
  readonly description?: string;
}

@Validate({
  rules: {
    title: 'string|max:100',
    description: 'string'
  }
})
export class UpdateTodoDto {
  readonly title?: string;
  readonly description?: string;
}
