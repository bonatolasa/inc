import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { Role } from 'src/enums/role.enum';
import { authorize } from 'src/auth/decorators/authorize.decorator';
import { Permissions } from 'src/auth/constants/permissions.constants';
import { CreateTaskDto, UpdateTaskDto } from '../dtos/tasks.dto';
import {
  SingleTaskResponseDto,
  TaskListResponseDto,
} from '../responses/tasks.response';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @authorize({
    requireAll: false,
    roles: [Role.TEAM_MEMBER, Role.PROJECT_MANAGER, Role.ADMIN, Role.TESTER],
    permissions: [Permissions.TASKS_VIEW],
  })
  @Get('my-tasks')
  async getMyTasks(@CurrentUser() user: { id: string }): Promise<TaskListResponseDto> {
    const tasks = await this.tasksService.getMyTasks(user.id);
    return {
      success: true,
      data: tasks as any,
      message: 'My tasks retrieved successfully',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.TASKS_VIEW],
    roles: [Role.TEAM_MEMBER, Role.PROJECT_MANAGER, Role.ADMIN],
  })
  @Get('due-soon')
  async getTasksDueSoon(@Query('days') days?: number): Promise<TaskListResponseDto> {
    const tasks = await this.tasksService.getTasksDueSoon(days ? Number(days) : 3);
    return {
      success: true,
      data: tasks,
      message: 'Tasks due soon retrieved',
    };
  }

  @authorize({
    requireAll: false,
    roles: [Role.PROJECT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN],
    permissions: [Permissions.TASKS_CREATE, Permissions.TASKS_ASSIGN],
    // context: { check: 'project_member', projectIdBodyField: 'project' },
  })
  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: { id: string },
  ): Promise<SingleTaskResponseDto> {
    // Convert priority to lowercase if provided
    if (createTaskDto.priority && typeof createTaskDto.priority === 'string') {
      createTaskDto.priority = createTaskDto.priority.toLowerCase() as any;
    }
    const task = await this.tasksService.create(createTaskDto, user.id);
    return {
      success: true,
      data: task,
      message: 'Task created successfully',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.TASKS_VIEW],
    roles: [Role.TEAM_MEMBER, Role.PROJECT_MANAGER, Role.ADMIN, Role.TESTER],
  })
  @Get()
  async findAll(
    @Query('projectId') projectId?: string,
    @CurrentUser() user?: { id: string; roles?: string[]; permissions?: string[] },
  ): Promise<TaskListResponseDto> {
    const roles = (user?.roles || []).map((r) => r.toLowerCase());
    const permissions = user?.permissions || [];
    const canViewAll =
      roles.includes(Role.SUPER_ADMIN) ||
      roles.includes(Role.ADMIN) ||
      permissions.includes(Permissions.TASKS_VIEW_ALL);

    const tasks = projectId
      ? canViewAll
        ? await this.tasksService.findByProject(projectId)
        : (await this.tasksService.findByProject(projectId)).filter((task) =>
            (task.assignedTo || []).some((assignee) => assignee._id === user!.id),
          )
      : canViewAll
        ? await this.tasksService.findAll()
        : await this.tasksService.findVisibleByUser(user!.id);
    return {
      success: true,
      data: tasks,
      message: 'Tasks retrieved successfully',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.TASKS_VIEW],
    roles: [Role.PROJECT_MANAGER, Role.ADMIN],
  })
  @Get('overdue')
  async getOverdueTasks(): Promise<TaskListResponseDto> {
    const tasks = await this.tasksService.getOverdueTasks();
    return {
      success: true,
      data: tasks,
      message: 'Overdue tasks retrieved',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.TASKS_VIEW],
    roles: [Role.TEAM_MEMBER, Role.PROJECT_MANAGER, Role.ADMIN, Role.TESTER],
  })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SingleTaskResponseDto> {
    const task = await this.tasksService.findById(id);
    return {
      success: true,
      data: task,
      message: 'Task retrieved successfully',
    };
  }

  @authorize({
    requireAll: false,
    roles: [Role.PROJECT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.TEAM_MEMBER, Role.TESTER],
    permissions: [
      Permissions.TASKS_UPDATE,
      Permissions.TASKS_TEST_UPDATE,
      Permissions.TEST_TASK,
      Permissions.REPORT_BUG,
      Permissions.VERIFY_TASK,
    ],
    context: { check: 'task_access', taskIdParam: 'id' },
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: { id: string; role: string; roles?: string[] },
  ): Promise<SingleTaskResponseDto> {
    const task = await this.tasksService.update(id, updateTaskDto, user);
    return {
      success: true,
      data: task,
      message: 'Task updated successfully',
    };
  }

  @authorize({
    requireAll: false,
    roles: [Role.PROJECT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.TEAM_MEMBER, Role.TESTER],
    permissions: [
      Permissions.TASKS_UPDATE,
      Permissions.TASKS_TEST_UPDATE,
      Permissions.TEST_TASK,
      Permissions.REPORT_BUG,
      Permissions.VERIFY_TASK,
    ],
    context: { check: 'task_access', taskIdParam: 'id' },
  })
  @Put(':id')
  async updateViaPut(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: { id: string; role: string; roles?: string[] },
  ): Promise<SingleTaskResponseDto> {
    const task = await this.tasksService.update(id, updateTaskDto, user);
    return {
      success: true,
      data: task,
      message: 'Task updated successfully',
    };
  }

  @authorize({
    requireAll: false,
    roles: [Role.PROJECT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN],
    permissions: [Permissions.TASKS_DELETE],
    context: { check: 'task_access', taskIdParam: 'id' },
  })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.tasksService.remove(id);
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.TASKS_VIEW],
    roles: [Role.PROJECT_MANAGER, Role.ADMIN, Role.TEAM_MEMBER, Role.TESTER],
  })
  @Get('project/:projectId')
  async getTasksByProject(@Param('projectId') projectId: string): Promise<TaskListResponseDto> {
    const tasks = await this.tasksService.getTasksByProject(projectId);
    return {
      success: true,
      data: tasks,
      message: 'Tasks retrieved by project',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.TASKS_VIEW],
    roles: [Role.PROJECT_MANAGER, Role.ADMIN],
  })
  @Get('user/:userId')
  async getTasksByUser(@Param('userId') userId: string): Promise<TaskListResponseDto> {
    const tasks = await this.tasksService.getTasksByUser(userId);
    return {
      success: true,
      data: tasks,
      message: 'Tasks retrieved by user',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.TASKS_VIEW],
    roles: [Role.PROJECT_MANAGER, Role.ADMIN],
  })
  @Get('creator/:userId')
  async getTasksByCreator(@Param('userId') userId: string): Promise<TaskListResponseDto> {
    const tasks = await this.tasksService.getTasksByCreator(userId);
    return {
      success: true,
      data: tasks,
      message: 'Tasks retrieved by creator',
    };
  }

  @authorize({
    requireAll: false,
    roles: [Role.PROJECT_MANAGER, Role.ADMIN, Role.TEAM_MEMBER, Role.TESTER],
    permissions: [
      Permissions.TASKS_UPDATE,
      Permissions.TASKS_TEST_UPDATE,
      Permissions.TEST_TASK,
      Permissions.REPORT_BUG,
      Permissions.VERIFY_TASK,
    ],
    // context: { check: 'task_access', taskIdParam: 'id' },
  })
  @Patch(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body('percentageComplete') percentageComplete: number,
  ): Promise<SingleTaskResponseDto> {
    const task = await this.tasksService.updateTaskProgress(id, percentageComplete);
    return {
      success: true,
      data: task,
      message: 'Task progress updated successfully',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.TASKS_UPDATE],
    roles: [Role.PROJECT_MANAGER, Role.ADMIN],
  })
  @Post(':taskId/dependencies/:dependencyId')
  async addDependency(
    @Param('taskId') taskId: string,
    @Param('dependencyId') dependencyId: string,
  ): Promise<SingleTaskResponseDto> {
    const task = await this.tasksService.addDependency(taskId, dependencyId);
    return {
      success: true,
      data: task,
      message: 'Dependency added successfully',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.TASKS_UPDATE],
    roles: [Role.PROJECT_MANAGER, Role.ADMIN],
  })
  @Delete(':taskId/dependencies/:dependencyId')
  async removeDependency(
    @Param('taskId') taskId: string,
    @Param('dependencyId') dependencyId: string,
  ): Promise<SingleTaskResponseDto> {
    const task = await this.tasksService.removeDependency(taskId, dependencyId);
    return {
      success: true,
      data: task,
      message: 'Dependency removed successfully',
    };
  }

  @authorize({
    requireAll: false,
    permissions: [Permissions.REPORTS_VIEW],
    roles: [Role.PROJECT_MANAGER, Role.ADMIN],
  })
  @Get('statistics/:projectId')
  async getTaskStatistics(@Param('projectId') projectId: string): Promise<any> {
    const statistics = await this.tasksService.getTaskStatistics(projectId);
    return {
      success: true,
      data: statistics,
      message: 'Task statistics retrieved',
    };
  }
}
