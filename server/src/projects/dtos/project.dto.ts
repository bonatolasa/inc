import {
  IsString,
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '../../enums/project-status.enum';
import { PartialType } from '@nestjs/mapped-types';

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  team!: string;

  @IsMongoId()
  @IsOptional()
  createdBy?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline!: Date;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  completedAt?: Date;
}

export class ProjectTeamDto {
  _id!: string;
  name!: string;
  members?: ProjectContributorDto[];
}

export class ProjectManagerDto {
  _id!: string;
  name!: string;
  email!: string;
}

export class ProjectContributorDto {
  _id!: string;
  name!: string;
  email!: string;
}
