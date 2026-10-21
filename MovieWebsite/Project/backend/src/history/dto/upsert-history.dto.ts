import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class UpsertHistoryDto {
  @IsString()
  @IsOptional()
  movieSlug?: string;

  @IsString()
  @IsOptional()
  movieId?: string;

  @IsString()
  @IsNotEmpty()
  episodeSlug: string;

  @IsString()
  @IsNotEmpty()
  serverName: string;

  @IsInt()
  @Min(0)
  progressSec: number;
}
