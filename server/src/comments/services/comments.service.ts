import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from 'src/enums/role.enum';
import { getRoleDisplayName } from 'src/auth/utils/role.utils';
import { TasksService } from 'src/tasks/services/tasks.service';
import { ActivitiesService } from 'src/activities/services/activities.service';
import { Comment } from '../schemas/comment.schema';
import { CreateCommentDto } from '../dtos/comments.dto';
import { NotificationEventsService } from 'src/notifications/services/notification-events.service';
import { NotificationEvents } from 'src/notifications/events/notification-events';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    private readonly tasksService: TasksService,
    private readonly notificationEvents: NotificationEventsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async create(
    taskId: string,
    currentUser: { id: string; role?: string },
    dto: CreateCommentDto,
  ) {
    const task = await this.tasksService.findById(taskId);

    const comment = await new this.commentModel({
      taskId,
      userId: currentUser.id,
      message: dto.message,
      parentCommentId: dto.parentCommentId,
    }).save();

    // Notify all assigned members and the creator
    const notificationTargets = new Set<string>();

    // Add assignees
    if (task.assignedTo) {
      const assignee: any = task.assignedTo as any;
      const id = assignee?._id?.toString() || assignee?.toString();
      if (id && id !== currentUser.id) notificationTargets.add(id);
    }

    // Add creator
    const creatorId =
      task.createdBy?._id?.toString() || task.createdBy?.toString();
    if (creatorId && creatorId !== currentUser.id) {
      notificationTargets.add(creatorId);
    }

    const senderName = getRoleDisplayName(currentUser.role);

    this.notificationEvents.emit(NotificationEvents.COMMENT_CREATED, {
      recipients: Array.from(notificationTargets),
      title: 'New Task Comment',
      message: `${senderName} commented on task: ${task.title}`,
      type: 'comment.created',
      relatedId: taskId,
    });

    await this.activitiesService.create({
      actionType: 'task_updated',
      performedBy: currentUser.id,
      targetId: taskId,
      description: `Comment added on task '${task.title}'`,
    });

    return this.commentModel
      .findById(comment._id)
      .populate('userId', 'name email role')
      .populate('parentCommentId', 'message userId')
      .exec();
  }

  async getByTask(taskId: string) {
    await this.tasksService.findById(taskId);

    return this.commentModel
      .find({ taskId })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 })
      .exec();
  }

  async remove(commentId: string, currentUser: { id: string; role: string }) {
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isOwner = comment.userId.toString() === currentUser.id;
    const isManager = currentUser.role?.toLowerCase() === Role.PROJECT_MANAGER;
    const isAdmin = currentUser.role?.toLowerCase() === Role.ADMIN;

    if (!isOwner && !isManager && !isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to delete this comment',
      );
    }

    await this.commentModel.findByIdAndDelete(commentId).exec();
  }
}
