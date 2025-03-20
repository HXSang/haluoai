import { Module } from '@nestjs/common';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { ClsModule } from 'nestjs-cls';
import { PermissionsModule } from '@n-modules/permissions/permissions.module';

@Module({
  imports: [
    PrismaModule,
    ClsModule.forFeature(),
    PermissionsModule,
  ],
  controllers: [RolesController],
  providers: [RolesService, RolesRepository],
  exports: [RolesService],
})
export class RolesModule {}
