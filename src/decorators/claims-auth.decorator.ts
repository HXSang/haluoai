import { AuthGuard } from '@n-guards/auth.guard';
import { PermissionGuard } from '@n-guards/permission.guard';
import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export function AuthClaims() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(AuthGuard, PermissionGuard),
  );
}
