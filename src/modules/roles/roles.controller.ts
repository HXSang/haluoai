import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthClaims, Permissions } from '@n-decorators';
import { PaginationDto } from '@n-dtos';
import { Permission } from '@n-constants';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { FilterRoleDto } from './dtos/filter-role.dto';
import { ArchivedRoleDto } from './dtos/archived-role.dto';

@Controller('role')
@ApiTags('Role')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Post()
  @Permissions([Permission.CREATE_ROLE])
  @AuthClaims()
  create(
  @Body() createRoleDto: CreateRoleDto,
  ) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  @Permissions([Permission.GET_ROLES])
  @AuthClaims()
  findAll(
  @Query() { page, limit }: PaginationDto,
    @Query() filter: FilterRoleDto,
  ) {
    return this.rolesService.getRoles(page, limit, filter);
  }

  @Patch(':id')
  @Permissions([Permission.UPDATE_ROLE])
  @AuthClaims()
  update(
  @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @Permissions([Permission.DELETE_ROLE])
  @AuthClaims()
  remove(
  @Param('id', ParseIntPipe) id: number,
  ) {
    return this.rolesService.deleteRole(id);
  }
}
