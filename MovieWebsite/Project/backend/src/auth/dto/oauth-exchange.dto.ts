import { IsString, IsNotEmpty } from 'class-validator';

export class OAuthExchangeDto {
  @IsString()
  @IsNotEmpty({ message: 'Code không được để trống' })
  code!: string;
}
