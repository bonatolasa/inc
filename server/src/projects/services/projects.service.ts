import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../schemas/project.schema';
import { TeamsService } from 'src/teams/services/teams.service';
import { CreateProjectDto, UpdateProjectDto } from '../dtos/project.dto';
import { ProjectResponseDto } from '../responses/project.response';
import { ProjectStatus } from 'src/enums/project-status.enum';
import { NotificationEventsService } from 'src/notifications/services/notification-events.service';
import { NotificationEvents } from 'src/notifications/events/notification-events';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    private readonly teamsService: TeamsService,
    private readonly notificationEvents: NotificationEventsService,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    creatorId: string,
  ): Promise<ProjectResponseDto> {
    const team = await this.teamsService.findById(createProjectDto.team);
    if (!team) {
      throw new BadRequestException('Invalid team ID');
    }

    const startDate = createProjectDto.startDate || new Date();
    const deadline =
      createProjectDto.deadline ||
      new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000);

    const project = await this.projectModel.create({
      ...createProjectDto,
      createdBy: creatorId,
      startDate,
      deadline,
    });

    // Notify all team members except the creator
    const recipientIds = (team.members || [])
      .map((member: any) => member?._id?.toString?.() || member?.toString?.())
      .filter((id: string) => !!id && id !== creatorId);
    this.notificationEvents.emit(NotificationEvents.PROJECT_CREATED, {
      recipients: recipientIds,
      title: 'New Project Created',
      message: `A new project "${project.name}" was created in your team`,
      type: 'project.created',
      relatedId: project._id.toString(),
    });

    return this.getProjectWithDetails(project._id.toString());
  }

  async findAll(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectModel
      .find()
      .populate({
        path: 'team',
        select: 'name members',
        populate: {
          path: 'members',
          select: 'name email',
        },
      })
      .populate('createdBy', 'name email')
      .exec();

    return projects.map((project) => this.mapToResponseDto(project));
  }

  async findVisibleByUser(userId: string): Promise<ProjectResponseDto[]> {
    const teams = await this.teamsService.getTeamsByMember(userId);
    const teamIds = teams.map((team) => team._id);
    const projects = await this.projectModel
      .find({
        $or: [
          { createdBy: userId },
          { team: { $in: teamIds } },
        ],
      })
      .populate({
        path: 'team',
        select: 'name members',
        populate: {
          path: 'members',
          select: 'name email',
        },
      })
      .populate('createdBy', 'name email')
      .exec();

    return projects.map((project) => this.mapToResponseDto(project));
  }

  async findById(id: string): Promise<ProjectResponseDto> {
    if (!id || id === 'contributor' || id.length < 24) {
       throw new BadRequestException('Invalid Project ID');
    }
    return this.getProjectWithDetails(id);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectResponseDto> {
    if (updateProjectDto.status === ProjectStatus.COMPLETED) {
      updateProjectDto.completedAt = new Date();
      updateProjectDto.progress = 100;
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, {
        new: true,
        runValidators: true,
      })
      .populate('team', 'name members')
      .populate('createdBy', 'name email')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return this.mapToResponseDto(updated);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.projectModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return {
      success: true,
      message: 'Project deleted successfully',
    };
  }

  async getProjectsByTeam(teamId: string): Promise<ProjectResponseDto[]> {
    const projects = await this.projectModel
      .find({ team: teamId })
      .populate('team', 'name members')
      .populate('createdBy', 'name email')
      .exec();
    return projects.map((project) => this.mapToResponseDto(project));
  }

  async getProjectsByManager(managerId: string): Promise<ProjectResponseDto[]> {
    const projects = await this.projectModel
      .find({ createdBy: managerId })
      .populate('team', 'name members')
      .populate('createdBy', 'name email')
      .exec();
    return projects.map((project) => this.mapToResponseDto(project));
  }

  async getProjectsByContributor(userId: string): Promise<ProjectResponseDto[]> {
    if (!userId || userId === 'undefined' || userId === 'null') {
      return [];
    }
    const teams = await this.teamsService.getTeamsByMember(userId);
    const teamIds = teams.map((team) => team._id);
    if (!teamIds.length) {
      return [];
    }
    const projects = await this.projectModel
      .find({ team: { $in: teamIds } })
      .populate('team', 'name members')
      .populate('createdBy', 'name email')
      .exec();
    return projects.map((project) => this.mapToResponseDto(project));
  }

  async updateProgress(projectId: string, progress: number): Promise<ProjectResponseDto> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (progress < 0 || progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }

    project.progress = progress;
    if (progress >= 100) {
      project.status = ProjectStatus.COMPLETED;
      project.completedAt = new Date();
    } else if (progress > 0 && project.status === ProjectStatus.PLANNING) {
      project.status = ProjectStatus.IN_PROGRESS;
    }
    await project.save();
    return this.getProjectWithDetails(projectId);
  }

  async recalculateProjectProgress(projectId: string): Promise<void> {
    const tasks = await this.projectModel.db.model('Task').find({ project: projectId });
    if (!tasks.length) {
      await this.updateProgress(projectId, 0);
      return;
    }
    const totalProgress = tasks.reduce((sum: number, task: any) => {
      return sum + (task.percentageComplete || 0);
    }, 0);
    await this.updateProgress(projectId, Math.round(totalProgress / tasks.length));
  }

  async getOverdueProjects(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectModel
      .find({
        deadline: { $lt: new Date() },
        status: { $ne: ProjectStatus.COMPLETED },
      })
      .populate('team', 'name members')
      .populate('createdBy', 'name email')
      .exec();
    return projects.map((project) => this.mapToResponseDto(project));
  }

  private async getProjectWithDetails(projectId: string): Promise<ProjectResponseDto> {
    const project = await this.projectModel
      .findById(projectId)
      .populate({
        path: 'team',
        select: 'name members',
        populate: {
          path: 'members',
          select: 'name email',
        },
      })
      .populate('createdBy', 'name email')
      .exec();

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    return this.mapToResponseDto(project);
  }

  private mapToResponseDto(project: Project): ProjectResponseDto {
    return {
      _id: project._id.toString(),
      name: project.name,
      description: project.description,
      team: {
        _id: (project.team as any)?._id?.toString() || '',
        name: (project.team as any)?.name || '',
        members: ((project.team as any)?.members || []).map((member: any) => ({
          _id: member?._id?.toString() || '',
          name: member?.name || '',
          email: member?.email || '',
        })),
      },
      createdBy: {
        _id: (project.createdBy as any)?._id?.toString() || '',
        name: (project.createdBy as any)?.name || '',
        email: (project.createdBy as any)?.email || '',
      },
      startDate: project.startDate,
      deadline: project.deadline,
      status: project.status,
      progress: project.progress,
      completedAt: project.completedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
