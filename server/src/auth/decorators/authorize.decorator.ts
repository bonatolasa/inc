import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import {
  ACCESS_CONTROL_KEY,
  AccessControlMetadata,
  PERMISSIONS_KEY,
} from '../constants/guard.constants';

export function authorize(...permissions: string[]): MethodDecorator & ClassDecorator;
export function authorize(
  metadata: AccessControlMetadata,
): MethodDecorator & ClassDecorator;
export function authorize(
  ...args: [AccessControlMetadata] | string[]
): MethodDecorator & ClassDecorator {
  let metadata: AccessControlMetadata;
  if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
    metadata = { requireAll: true, ...args[0] };
  } else {
    metadata = { permissions: args as string[], requireAll: true };
  }

  return applyDecorators(
    JwtAuthGuard(),
    SetMetadata(PERMISSIONS_KEY, metadata.permissions ?? []),
    SetMetadata(ACCESS_CONTROL_KEY, metadata),
    UseGuards(PermissionsGuard),
  );
}
