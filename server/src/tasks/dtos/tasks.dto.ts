import {
  IsString,
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  Min,
  Max,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus } from '../../enums/task-status.enum';
import { Priority } from '../../enums/priority.enum';
import { PartialType } from '@nestjs/mapped-types';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  project!: string;

  @IsArray()
  @IsMongoId({ each: true })
  assignedTo!: string[];

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @Min(0)
  @Max(100)
  @IsOptional()
  percentageComplete?: number;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @Type(() => Date)
  @IsDate()
  dueDate!: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startedAt?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  completedAt?: Date;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  dependencies?: string[];

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsNumber()
  @IsOptional()
  actualHours?: number;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startedAt?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  completedAt?: Date;
}
