import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class UpsertHistoryDto {
  @IsString()
  @IsNotEmpty()
  movieSlug: string;

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
