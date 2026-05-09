import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { NotificationsService } from './services/notifications.service';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationEventsService } from './services/notification-events.service';
import { NotificationListenerService } from './services/notification-listener.service';
import { RolesModule } from 'src/auth/roles/roles.module';

@Module({
  imports: [
    RolesModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationEventsService,
    NotificationListenerService,
  ],
  exports: [NotificationsService, NotificationEventsService],
})
export class NotificationsModule {}
