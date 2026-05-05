import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsMongoId,
  IsBoolean,
  Matches,
  IsArray,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. Must contain uppercase, lowercase, and numbers/symbols',
  })
  password!: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value.toLowerCase().trim().replace(/\s+/g, '_')];
    }
    return value?.map((v: string) => v.toLowerCase().trim().replace(/\s+/g, '_')) || ['team_member'];
  })
  roles?: string[];

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim().replace(/\s+/g, '_'))
  role?: string;

  @IsMongoId()
  @IsOptional()
  team?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class InviteUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value.toLowerCase().trim().replace(/\s+/g, '_')];
    }
    return value?.map((v: string) => v.toLowerCase().trim().replace(/\s+/g, '_')) || ['team_member'];
  })
  roles?: string[];

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim().replace(/\s+/g, '_'))
  role?: string;

  @IsMongoId()
  @IsOptional()
  team?: string;
}
