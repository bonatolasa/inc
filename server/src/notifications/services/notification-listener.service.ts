import { Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationEventsService } from './notification-events.service';
import { NotificationsService } from './notifications.service';
import { NotificationEvents } from '../events/notification-events';

@Injectable()
export class NotificationListenerService implements OnModuleInit {
  constructor(
    private readonly notificationEvents: NotificationEventsService,
    private readonly notificationsService: NotificationsService,
  ) {}

   onModuleInit() {
     Object.values(NotificationEvents).forEach((eventName) => {
       this.notificationEvents.on(eventName, async (payload) => {
         const recipients = Array.from(new Set((payload.recipients || []).filter(Boolean)));
         for (const recipient of recipients) {
           await this.notificationsService.create({
             userId: recipient,
             title: payload.title,
             message: payload.message,
             type: payload.type,
             relatedId: payload.relatedId,
           });
         }
       });
     });
   }
}
