import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProjectsService } from '../services/projects.service';
import { authorize } from 'src/auth/decorators/authorize.decorator';
import { Permissions } from 'src/auth/constants/permissions.constants';
import { Role } from 'src/enums/role.enum';
import { CreateProjectDto, UpdateProjectDto } from '../dtos/project.dto';
import {
  ProjectListResponseDto,
  SingleProjectResponseDto,
} from '../responses/project.response';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @authorize({
    requireAll: false,
    roles: [Role.PROJECT_MANAGER],
    permissions: [Permissions.PROJECTS_CREATE],
    // context: { check: 'team_member', teamIdParam: 'team', projectIdBodyField: 'team' },
  })
  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: { id: string },
  ): Promise<SingleProjectResponseDto> {
    const project = await this.projectsService.create(createProjectDto, user.id);
    return {
      success: true,
      data: project,
      message: 'Project created successfully',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.PROJECTS_VIEW],
    roles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER, Role.TESTER],
  })
  @Get()
  async findAll(
    @CurrentUser() user: { id: string; roles?: string[]; permissions?: string[] },
  ): Promise<ProjectListResponseDto> {
    const roles = (user.roles || []).map((r) => r.toLowerCase());
    const permissions = user.permissions || [];
    const canViewAll =
      roles.includes(Role.SUPER_ADMIN) ||
      roles.includes(Role.ADMIN) ||
      permissions.includes(Permissions.PROJECTS_VIEW_ALL);

    const projects = canViewAll
      ? await this.projectsService.findAll()
      : await this.projectsService.findVisibleByUser(user.id);
    return {
      success: true,
      data: projects,
      message: 'Projects retrieved successfully',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.PROJECTS_UPDATE],
    roles: [Role.PROJECT_MANAGER],
    // context: { check: 'project_member', projectIdParam: 'id' },
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<SingleProjectResponseDto> {
    const project = await this.projectsService.update(id, updateProjectDto);
    return {
      success: true,
      data: project,
      message: 'Project updated successfully',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.PROJECTS_DELETE],
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
    // context: { check: 'project_member', projectIdParam: 'id' },
  })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.projectsService.remove(id);
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.PROJECTS_VIEW],
    roles: [Role.TEAM_MEMBER, Role.TESTER, Role.PROJECT_MANAGER],
    // context: { check: 'team_member', teamIdParam: 'teamId' },
  })
  @Get('team/:teamId')
  async getProjectsByTeam(
    @Param('teamId') teamId: string,
  ): Promise<ProjectListResponseDto> {
    const projects = await this.projectsService.getProjectsByTeam(teamId);
    return {
      success: true,
      data: projects,
      message: 'Projects retrieved by team',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.PROJECTS_VIEW],
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
  })
  @Get('manager/:managerId')
  async getProjectsByManager(
    @Param('managerId') managerId: string,
  ): Promise<ProjectListResponseDto> {
    const projects = await this.projectsService.getProjectsByManager(managerId);
    return {
      success: true,
      data: projects,
      message: 'Projects retrieved by manager',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.PROJECTS_VIEW],
    roles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER, Role.TESTER],
  })
  @Get('contributor/:userId')
  async getProjectsByContributor(
    @Param('userId') userId: string,
  ): Promise<ProjectListResponseDto> {
    const projects = await this.projectsService.getProjectsByContributor(userId);
    return {
      success: true,
      data: projects,
      message: 'Projects retrieved by contributor',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.PROJECTS_UPDATE],
    roles: [Role.PROJECT_MANAGER, Role.TEAM_MEMBER],
    // context: { check: 'project_member', projectIdParam: 'id' },
  })
  @Patch(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body('progress') progress: number,
  ): Promise<SingleProjectResponseDto> {
    const project = await this.projectsService.updateProgress(id, progress);
    return {
      success: true,
      data: project,
      message: 'Project progress updated successfully',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.PROJECTS_VIEW],
    roles: [Role.ADMIN, Role.PROJECT_MANAGER],
  })
  @Get('overdue')
  async getOverdueProjects(): Promise<ProjectListResponseDto> {
    const projects = await this.projectsService.getOverdueProjects();
    return {
      success: true,
      data: projects,
      message: 'Overdue projects retrieved',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.PROJECTS_VIEW],
    roles: [Role.PROJECT_MANAGER, Role.TEAM_MEMBER, Role.TESTER],
    // context: { check: 'project_member', projectIdParam: 'id' },
  })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SingleProjectResponseDto> {
    const project = await this.projectsService.findById(id);
    return {
      success: true,
      data: project,
      message: 'Project retrieved successfully',
    };
  }
}
