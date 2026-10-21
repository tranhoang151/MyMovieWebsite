import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu không được quá 128 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Mật khẩu phải chứa ít nhất một chữ cái và một chữ số',
  })
  password!: string;

  @IsString()
  @MinLength(1, { message: 'Tên không được để trống' })
  @MaxLength(100, { message: 'Tên không được quá 100 ký tự' })
  name!: string;
}
