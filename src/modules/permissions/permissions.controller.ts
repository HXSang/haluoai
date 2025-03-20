import { Controller, Get } from '@nestjs/common';
import { AuthClaims, Permissions } from '@n-decorators';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '@n-constants';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@ApiTags('Permission')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) { }

  @Get()
  @Permissions([Permission.GET_PERMISSIONS])
  @AuthClaims()
  findAll() {
    return this.permissionsService.findAll();
  }
}
