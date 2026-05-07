import {
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
  IsBoolean,
  ArrayMinSize,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateTeamDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsOptional()
  manager?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  members!: string[];
}

export class UpdateTeamDto extends PartialType(CreateTeamDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
