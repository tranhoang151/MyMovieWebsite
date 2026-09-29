import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateMovieDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbUrl?: string;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @IsOptional()
  @IsString()
  quality?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  director?: string;

  @IsOptional()
  @IsString()
  casts?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  currentEpisode?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
