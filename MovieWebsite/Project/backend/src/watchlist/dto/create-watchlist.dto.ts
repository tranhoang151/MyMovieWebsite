import { IsString, IsOptional } from 'class-validator';

export class CreateWatchlistDto {
  @IsString()
  @IsOptional()
  movieSlug?: string;

  @IsString()
  @IsOptional()
  movieId?: string;
}
