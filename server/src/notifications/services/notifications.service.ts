import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../schemas/notification.schema';
import { CreateNotificationDto } from '../dtos/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const dedupeWindowMs = 90 * 1000;
    const since = new Date(Date.now() - dedupeWindowMs);
    const duplicate = await this.notificationModel
      .findOne({
        userId: createDto.userId,
        type: createDto.type,
        relatedId: createDto.relatedId || null,
        title: createDto.title,
        message: createDto.message,
        createdAt: { $gte: since },
      })
      .sort({ createdAt: -1 })
      .exec();
    if (duplicate) {
      return duplicate;
    }

    const notification = new this.notificationModel(createDto);
    return notification.save();
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, userId },
        { readStatus: true },
        { new: true },
      )
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany({ userId, readStatus: false }, { readStatus: true })
      .exec();
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.notificationModel
      .findOneAndDelete({ _id: id, userId })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Notification not found');
    }
  }
}
