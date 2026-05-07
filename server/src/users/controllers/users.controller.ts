import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import {
  SingleUserResponseDto,
  UserListResponseDto,
  GenericListResponseDto,
} from '../responses/users.response';
import { CreateUserDto, InviteUserDto, UpdateUserDto } from '../dtos/users.dto';
import { User } from '../schemas/users.schemas';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { authorize } from 'src/auth/decorators/authorize.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { RolesService } from 'src/auth/roles/roles.service';
import { Permissions } from 'src/auth/constants/permissions.constants';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
  ) { }

   @JwtAuthGuard()
   @Get('me')
   async getMe(
     @CurrentUser() user: { id: string },
   ): Promise<SingleUserResponseDto> {
     const userData = await this.usersService.getUserById(user.id);
     const combinedPermissions = await this.rolesService.buildEffectivePermissions(
       userData.roles,
       userData.permissions || [],
     );
     
     return {
       success: true,
       data: {
         ...userData,
         permissions: combinedPermissions,
       },
       message: 'User retrieved successfully',
     };
   }

  @authorize(Permissions.USERS_ASSIGN_ROLES)
  @Patch(':id/roles')
  async assignRoles(
    @Param('id') id: string,
    @Body() body: { roles: string[] },
  ): Promise<SingleUserResponseDto> {
    const user = await this.usersService.assignRoles(id, body.roles);
    return {
      success: true,
      data: user,
      message: 'Roles assigned successfully',
    };
  }

  @JwtAuthGuard()
  @Get('managers/stats')
  async getManagerStats(): Promise<GenericListResponseDto<any>> {
    const stats = await this.usersService.getManagerStats();
    return {
      success: true,
      data: stats,
      message: 'Manager stats retrieved successfully',
    };
  }

  @JwtAuthGuard()
  @Patch('me')
  async updateMe(
    @CurrentUser() user: { id: string },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<SingleUserResponseDto> {
    return this.updateUser(user.id, updateUserDto);
  }

  @authorize(Permissions.USERS_CREATE)
  @Post()
  async createUsers(
    @Body() createUserDto: CreateUserDto,
  ): Promise<SingleUserResponseDto> {
    const user = await this.usersService.createUsers(createUserDto);
    return {
      success: true,
      data: user,
      message: 'User created successfully',
    };
  }

  @authorize(Permissions.USERS_CREATE)
  @Post('invite')
  async inviteUser(
    @Body() inviteUserDto: InviteUserDto,
  ): Promise<SingleUserResponseDto & { inviteEmailSent: boolean }> {
    const { user, emailSent } = await this.usersService.inviteUser(inviteUserDto);
    return {
      success: true,
      data: user,
      inviteEmailSent: emailSent,
      message: emailSent
        ? 'Invitation sent successfully'
        : 'User invited, but email was not sent because SMTP is not configured in .env. Use your existing environment file and do not create a new example file.',
    };
  }

  @authorize(Permissions.USERS_VIEW)
  @Get()
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<UserListResponseDto> {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const { users, total } = await this.usersService.getAllUsers(pageNum, limitNum);
    return {
      success: true,
      data: users,
      total,
      page: pageNum,
      limit: limitNum,
      message: 'Users retrieved successfully',
    };
  }

  @authorize(Permissions.TEAMS_CREATE, Permissions.USERS_VIEW)
  @Get('members')
  async getTeamMembersForCreation(): Promise<UserListResponseDto> {
    const users = await this.usersService.getUsersByRole('team_member');
    return {
      success: true,
      data: users,
      total: users.length,
      page: 1,
      limit: users.length,
      message: 'Team members retrieved successfully',
    };
  }

  @authorize(Permissions.USERS_UPDATE)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<SingleUserResponseDto> {
    const user = await this.usersService.updateUser(id, updateUserDto);
    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    };
  }

  @authorize(Permissions.USERS_DELETE)
  @Delete(':id')
  async removeUser(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return await this.usersService.removeUser(id);
  }

  @authorize(Permissions.USERS_VIEW)
  @Get('role/:role')
  async getUsersByRole(
    @Param('role') role: string,
  ): Promise<UserListResponseDto> {
    const users = await this.usersService.getUsersByRole(role);
    return {
      success: true,
      data: users,
      message: 'Users retrieved by role',
    };
  }

   @authorize(Permissions.USERS_VIEW)
   @Get('team/:teamId')
   async getUsersByTeam(
     @Param('teamId') teamId: string,
   ): Promise<UserListResponseDto> {
     const users = await this.usersService.getUsersByTeam(teamId);
     return {
       success: true,
       data: users,
       message: 'Users retrieved by team',
     };
   }

   @authorize(Permissions.USERS_UPDATE)
   @Patch(':id/permissions')
   async updateUserPermissions(
     @Param('id') id: string,
     @Body() body: { permissions: string[] },
   ): Promise<SingleUserResponseDto> {
     const user = await this.usersService.updateUserPermissions(id, body.permissions);
     return {
       success: true,
       data: user,
       message: 'User permissions updated successfully',
     };
   }
}
