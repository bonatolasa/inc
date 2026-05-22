import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { authorize } from '../decorators/authorize.decorator';
import { Permissions } from '../constants/permissions.constants';
import { User } from '../../users/schemas/users.schemas';

@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  @authorize({ permissions: [Permissions.ROLES_VIEW] })
  @Get()
  async getAllRoles() {
    return {
      success: true,
      data: await this.rolesService.getAllRoles(),
    };
  }

  @authorize({ permissions: [Permissions.ROLES_CREATE] })
  @Post()
  async createRole(@Body() body: { name: string; displayName?: string; description?: string }) {
    return {
      success: true,
      data: await this.rolesService.createRole(body.name, body.displayName, body.description),
      message: 'Role created successfully',
    };
  }

  @JwtAuthGuard()
  @Get(':name')
  async getRole(@Param('name') name: string) {
    return {
      success: true,
      data: await this.rolesService.getByName(name),
    };
  }

  @authorize({ permissions: [Permissions.ROLES_UPDATE] })
  @Patch(':name/display-name')
  async updateDisplayName(
    @Param('name') name: string,
    @Body() body: { displayName: string },
  ) {
    return {
      success: true,
      data: await this.rolesService.updateDisplayName(name, body.displayName),
      message: 'Display name updated successfully',
    };
  }

  @authorize({ permissions: [Permissions.ROLES_ASSIGN_PERMISSIONS] })
  @Patch(':name/permissions')
  async addPermissions(
    @Param('name') name: string,
    @Body() body: { permissions: string[] },
  ) {
    return {
      success: true,
      data: await this.rolesService.addPermissions(name, body.permissions || []),
      message: 'Permissions assigned to role',
    };
  }

  @authorize({ permissions: [Permissions.ROLES_ASSIGN_PERMISSIONS] })
  @Delete(':name/permissions')
  async removePermissions(
    @Param('name') name: string,
    @Body() body: { permissions: string[] },
  ) {
    return {
      success: true,
      data: await this.rolesService.removePermissions(name, body.permissions || []),
      message: 'Permissions removed from role',
    };
  }

  @authorize({ permissions: [Permissions.ROLES_DELETE] })
  @Delete(':name')
  async deleteRole(@Param('name') name: string) {
    const normalized = name.toLowerCase().trim().replace(/\s+/g, '_');
    await this.rolesService.deleteRole(normalized);
    await this.userModel.updateMany(
      { roles: normalized },
      { $pull: { roles: normalized } },
    );
    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }
}
