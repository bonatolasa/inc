import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';
import { Role } from 'src/enums/role.enum';
import { authorize } from 'src/auth/decorators/authorize.decorator';
import { Permissions } from 'src/auth/constants/permissions.constants';
import {
  SingleTeamResponseDto,
  TeamListResponseDto,
} from '../responses/teams.response';
import { CreateTeamDto, UpdateTeamDto } from '../dtos/teams.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) { }

  @authorize({
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
    permissions: [Permissions.TEAMS_CREATE],
  })
  @Post()
  async createTeam(
    @Body() createTeamDto: CreateTeamDto,
    @CurrentUser() user: { id: string; roles?: string[]; role?: string },
  ): Promise<SingleTeamResponseDto> {
    const team = await this.teamsService.createTeam(createTeamDto, user);
    return { success: true, data: team, message: 'Team created successfully' }
  }

  @authorize({
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
    permissions: [Permissions.TEAMS_VIEW],
  })
  @Get()
  async findAll(
    @CurrentUser() user: { id: string; roles?: string[]; permissions?: string[] },
  ): Promise<TeamListResponseDto> {
    const roles = (user.roles || []).map((r) => r.toLowerCase());
    const permissions = user.permissions || [];
    const canViewAll =
      roles.includes(Role.SUPER_ADMIN) ||
      roles.includes(Role.ADMIN) ||
      permissions.includes(Permissions.TEAMS_VIEW_ALL);

    const teams = canViewAll
      ? await this.teamsService.findAll()
      : await this.teamsService.findVisibleByUser(user.id);
    return { success: true, data: teams, message: 'Teams retrieved successfully' };
  }

  @authorize({
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
    permissions: [Permissions.TEAMS_UPDATE],
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ): Promise<SingleTeamResponseDto> {
    const team = await this.teamsService.update(id, updateTeamDto);
    return { success: true, data: team, message: 'Team updated successfully' };
  }

  @authorize({
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
    permissions: [Permissions.TEAMS_DELETE],
  })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.teamsService.remove(id);
  }

  @authorize({
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
    permissions: [Permissions.TEAMS_MANAGE],
  })
  @Post(':teamId/members/:userId')
  async addMember(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
  ): Promise<SingleTeamResponseDto> {
    const team = await this.teamsService.addMember(teamId, userId);
    return { success: true, data: team, message: 'Member added to team successfully' };
  }

  @authorize({
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
    permissions: [Permissions.TEAMS_MANAGE],
  })
  @Delete(':teamId/members/:userId')
  async removeMember(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
  ): Promise<SingleTeamResponseDto> {
    const team = await this.teamsService.removeMember(teamId, userId);
    return { success: true, data: team, message: 'Member removed from team successfully' };
  }

  @authorize({
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
    permissions: [Permissions.TEAMS_VIEW],
  })
  @Get('manager/:managerId')
  async getTeamsByManager(@Param('managerId') managerId: string): Promise<TeamListResponseDto> {
    const teams = await this.teamsService.getTeamsByManager(managerId);
    return { success: true, data: teams, message: 'Teams retrieved by manager' };
  }

  @authorize({
    roles: [Role.TEAM_MEMBER, Role.TESTER, Role.PROJECT_MANAGER],
    permissions: [Permissions.TEAMS_VIEW],
  })
  @Get('my-team')
  async getMyTeam(@CurrentUser() user: { id: string }): Promise<SingleTeamResponseDto> {
    const team = await this.teamsService.getTeamByMember(user.id);
    return { success: true, data: team, message: 'Team retrieved successfully' };
  }

  @authorize({
    roles: [Role.TEAM_MEMBER, Role.TESTER, Role.PROJECT_MANAGER],
    permissions: [Permissions.TEAMS_VIEW],
  })
  @Get('my-teams')
  async getMyTeams(@CurrentUser() user: { id: string }): Promise<TeamListResponseDto> {
    const teams = await this.teamsService.getTeamsByMember(user.id);
    return { success: true, data: teams, message: 'Teams retrieved successfully' };
  }

  @authorize({
    permissions: [Permissions.TEAMS_VIEW],
    roles: [Role.TEAM_MEMBER, Role.TESTER, Role.PROJECT_MANAGER, Role.ADMIN],
  })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SingleTeamResponseDto> {
    const team = await this.teamsService.findById(id);
    return { success: true, data: team, message: 'Team retrieved successfully' };
  }

  @authorize({
    permissions: [Permissions.TEAMS_VIEW],
    roles: [Role.TEAM_MEMBER, Role.TESTER, Role.PROJECT_MANAGER, Role.ADMIN],
  })
  @Get(':id/members')
  async getTeamMembers(@Param('id') id: string): Promise<{
    success: boolean;
    data: { _id: string; name: string; email: string; role: string }[];
    message: string;
  }> {
    const members = await this.teamsService.getTeamMembers(id);
    return { success: true, data: members, message: 'Team members retrieved successfully' };
  }
}
