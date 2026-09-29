import { IsString, IsNotEmpty } from 'class-validator';

export class SyncDto {
  @IsString()
  @IsNotEmpty()
  slug: string;
}
