import { Validate } from '../../../../dist';

@Validate({
  rules: {
    username: 'required|string|min:3|max:255|unique_username',
    password: 'required|string|min:6|max:255',
    passwordConfirm: 'required|string|same:password'
  },
  messages: {
    'passwordConfirm.same': `Both passwords are not the same.`
  }
})
export class RegisterDto {
  readonly username: string;
  readonly password: string;
  readonly passwordConfirm: string;
}

@Validate({
  rules: {
    username: 'required|string',
    password: 'required|string'
  }
})
export class LoginDto {
  readonly username: string;
  readonly password: string;
}
