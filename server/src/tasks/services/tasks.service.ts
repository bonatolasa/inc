import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from '../schemas/tasks.schema';
import { Project } from 'src/projects/schemas/project.schema';
import { CreateTaskDto, UpdateTaskDto } from '../dtos/tasks.dto';
import { TaskResponseDto } from '../responses/tasks.response';
import { TaskStatus } from 'src/enums/task-status.enum';
import { Role } from 'src/enums/role.enum';
import { ProjectsService } from 'src/projects/services/projects.service';
import { NotificationEventsService } from 'src/notifications/services/notification-events.service';
import { NotificationEvents } from 'src/notifications/events/notification-events';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    private readonly projectsService: ProjectsService,
    private readonly notificationEvents: NotificationEventsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, creatorId: string): Promise<TaskResponseDto> {
    const project = await this.projectModel
      .findById(createTaskDto.project)
      .populate('team', 'members manager')
      .select('team createdBy')
      .exec();
    if (!project) {
      throw new BadRequestException('Invalid project ID');
    }

    const teamMembers = ((project.team as any)?.members || []).map((m: any) => m.toString());
    const allAssignedInTeam = createTaskDto.assignedTo.every(
      (id) => teamMembers.includes(id),
    );
    
    if (!allAssignedInTeam) {
      throw new BadRequestException('All task assignees must be team members of the assigned project team');
    }

    if (
      createTaskDto.status === TaskStatus.IN_PROGRESS &&
      !createTaskDto.startedAt
    ) {
      createTaskDto.startedAt = new Date();
    }
    if (createTaskDto.status === TaskStatus.COMPLETED) {
      createTaskDto.completedAt = new Date();
      createTaskDto.percentageComplete = 100;
    }

    const created = await this.taskModel.create({ ...createTaskDto, createdBy: creatorId });
    
    // Notifications
    const recipients = [...new Set([...createTaskDto.assignedTo, creatorId])];
    this.notificationEvents.emit(NotificationEvents.TASK_CREATED, {
      recipients,
      title: 'Task Created',
      message: `Task "${created.title}" was created`,
      type: 'task.created',
      relatedId: created._id.toString(),
    });

    this.notificationEvents.emit(NotificationEvents.TASK_ASSIGNED, {
      recipients: createTaskDto.assignedTo,
      title: 'Task Assigned',
      message: `You have been assigned to task "${created.title}"`,
      type: 'task.assigned',
      relatedId: created._id.toString(),
    });

    await this.projectsService.recalculateProjectProgress(createTaskDto.project);
    return this.getTaskWithDetails(created._id.toString());
  }

  async findAll(): Promise<TaskResponseDto[]> {
    const tasks = await this.taskModel
      .find()
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title')
      .exec();
    return tasks.map((task) => this.mapToResponseDto(task));
  }

  async findVisibleByUser(userId: string): Promise<TaskResponseDto[]> {
    return this.getTasksByUser(userId);
  }

  async findByProject(projectId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.taskModel
      .find({ project: projectId })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title')
      .exec();
    return tasks.map((task) => this.mapToResponseDto(task));
  }

  async findById(id: string): Promise<TaskResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Task ID');
    }
    return this.getTaskWithDetails(id);
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user?: { id: string; role: string; roles?: string[] },
  ): Promise<TaskResponseDto> {
    const task = await this.taskModel
      .findById(id)
      .populate('project', 'createdBy team')
      .exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (updateTaskDto.assignedTo) {
      const project = await this.projectModel
        .findById(task.project)
        .populate('team', 'members')
        .select('team')
        .exec();
      const members = ((project?.team as any)?.members || []).map((m: any) => m.toString());
      const allInTeam = updateTaskDto.assignedTo.every((id) => members.includes(id));
      if (!allInTeam) {
        throw new BadRequestException('All task assignees must be members of the project team');
      }
    }

    if (updateTaskDto.percentageComplete !== undefined) {
      if (updateTaskDto.percentageComplete === 0) {
        updateTaskDto.status = TaskStatus.PENDING;
      } else if (updateTaskDto.percentageComplete === 100) {
        updateTaskDto.status = TaskStatus.COMPLETED;
        updateTaskDto.completedAt = new Date();
      } else if (updateTaskDto.percentageComplete > 0) {
        updateTaskDto.status = TaskStatus.IN_PROGRESS;
        updateTaskDto.startedAt = updateTaskDto.startedAt || new Date();
      }
    }

    const oldAssignees = (task.assignedTo || []).map(a => a.toString());
    const previousStatus = task.status;
    const updated = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, {
        new: true,
        runValidators: true,
      })
      .populate('project', 'name createdBy')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title')
      .exec();
    
    if (!updated) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const getRecipientId = (val: any) => val?._id?.toString?.() || val?.toString?.();
    const newAssignees = (updated.assignedTo || []).map(a => getRecipientId(a)).filter(Boolean);
    const creatorRecipient = getRecipientId(updated.createdBy);

    const recipients = [...new Set([...newAssignees, creatorRecipient].filter(Boolean))];

    this.notificationEvents.emit(NotificationEvents.TASK_UPDATED, {
      recipients,
      title: 'Task Updated',
      message: `Task "${updated.title}" has been updated`,
      type: 'task.updated',
      relatedId: updated._id.toString(),
    });

    const newStatus = updated.status;
    if (previousStatus !== newStatus && newStatus === TaskStatus.IN_REVIEW) {
      this.notificationEvents.emit(NotificationEvents.TASK_TESTING_REQUESTED, {
        recipients,
        title: 'Testing Requested',
        message: `Task "${updated.title}" is ready for QA review`,
        type: 'task.testing_requested',
        relatedId: updated._id.toString(),
      });
    }

    if (
      previousStatus !== newStatus &&
      newStatus === TaskStatus.BLOCKED &&
      (previousStatus === TaskStatus.COMPLETED || previousStatus === TaskStatus.IN_REVIEW)
    ) {
      this.notificationEvents.emit(NotificationEvents.TASK_BUG_REOPENED, {
        recipients,
        title: 'Bug Reopened',
        message: `Task "${updated.title}" was reopened due to a reported issue`,
        type: 'task.bug_reopened',
        relatedId: updated._id.toString(),
      });
    }

    const newlyAssigned = newAssignees.filter(id => !oldAssignees.includes(id));
    if (newlyAssigned.length > 0) {
      this.notificationEvents.emit(NotificationEvents.TASK_ASSIGNED, {
        recipients: newlyAssigned,
        title: 'Task Assigned',
        message: `You have been assigned to task "${updated.title}"`,
        type: 'task.assigned',
        relatedId: updated._id.toString(),
      });
    }

    await this.projectsService.recalculateProjectProgress(
      (updated.project as any)._id?.toString() || updated.project.toString(),
    );
    return this.mapToResponseDto(updated);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const task = await this.taskModel.findByIdAndDelete(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    if (task.project) {
      await this.projectsService.recalculateProjectProgress(task.project.toString());
    }
    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }

  async getTasksByProject(projectId: string): Promise<TaskResponseDto[]> {
    return this.findByProject(projectId);
  }

  async getTasksByUser(userId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.taskModel
      .find({ assignedTo: { $in: [userId] } })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title')
      .exec();
    return tasks.map((task) => this.mapToResponseDto(task));
  }

  async getMyTasks(userId: string): Promise<Task[]> {
    return this.taskModel
      .find({ assignedTo: { $in: [new Types.ObjectId(userId)] } })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getTasksByCreator(userId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.taskModel
      .find({ createdBy: userId })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title')
      .exec();
    return tasks.map((task) => this.mapToResponseDto(task));
  }

  async updateTaskProgress(id: string, percentageComplete: number): Promise<TaskResponseDto> {
    if (percentageComplete < 0 || percentageComplete > 100) {
      throw new BadRequestException('Percentage must be between 0 and 100');
    }
    return this.update(id, { percentageComplete } as UpdateTaskDto);
  }

  async addDependency(taskId: string, dependencyId: string): Promise<TaskResponseDto> {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    if (!task.dependencies.includes(dependencyId as any)) {
      task.dependencies.push(dependencyId as any);
      await task.save();
    }
    return this.getTaskWithDetails(taskId);
  }

  async removeDependency(taskId: string, dependencyId: string): Promise<TaskResponseDto> {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    task.dependencies = task.dependencies.filter((depId) => depId.toString() !== dependencyId);
    await task.save();
    return this.getTaskWithDetails(taskId);
  }

  async getOverdueTasks(): Promise<TaskResponseDto[]> {
    const tasks = await this.taskModel
      .find({
        dueDate: { $lt: new Date() },
        status: { $ne: TaskStatus.COMPLETED },
      })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title')
      .exec();
    return tasks.map((task) => this.mapToResponseDto(task));
  }

  async getTasksDueSoon(days = 3): Promise<TaskResponseDto[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);
    const tasks = await this.taskModel
      .find({
        dueDate: { $gte: now, $lte: future },
        status: { $ne: TaskStatus.COMPLETED },
      })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title')
      .exec();
    return tasks.map((task) => this.mapToResponseDto(task));
  }

  async getTaskStatistics(projectId?: string): Promise<any> {
    const filter: any = {};
    if (projectId) {
      filter.project = projectId;
    }
    const tasks = await this.taskModel.find(filter).exec();
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length;
    const pending = tasks.filter((task) => task.status === TaskStatus.PENDING).length;

    return {
      total,
      completed,
      inProgress,
      pending,
      blocked: tasks.filter((task) => task.status === TaskStatus.BLOCKED).length,
      averageCompletion:
        total > 0
          ? tasks.reduce((sum, task) => sum + (task.percentageComplete || 0), 0) /
            total
          : 0,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  private async getTaskWithDetails(taskId: string): Promise<TaskResponseDto> {
    const task = await this.taskModel
      .findById(taskId)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title')
      .exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    return this.mapToResponseDto(task);
  }

  private mapToResponseDto(task: Task): TaskResponseDto {
    return {
      _id: task._id.toString(),
      title: task.title,
      description: task.description,
      project: task.project
        ? {
            _id: (task.project as any)._id?.toString() || (task.project as any).toString(),
            name: (task.project as any).name || '',
          }
        : undefined,
      assignedTo: Array.isArray(task.assignedTo) 
        ? task.assignedTo.map((u: any) => ({
            _id: u._id?.toString() || u.toString(),
            name: u.name || '',
            email: u.email || '',
          }))
        : [],
      createdBy: task.createdBy
        ? {
            _id: (task.createdBy as any)._id?.toString() || (task.createdBy as any).toString(),
            name: (task.createdBy as any).name || '',
            email: (task.createdBy as any).email || '',
          }
        : undefined,
      status: task.status,
      percentageComplete: task.percentageComplete,
      priority: task.priority,
      dueDate: task.dueDate,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      dependencies: task.dependencies
        ? task.dependencies.map((dep: any) => dep._id?.toString() || dep.toString())
        : [],
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      comments: task.comments,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
