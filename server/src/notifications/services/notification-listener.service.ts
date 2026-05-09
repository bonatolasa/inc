import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { NotificationEventsService } from './notification-events.service';
import { NotificationsService } from './notifications.service';
import { NotificationEvents } from '../events/notification-events';
import { RolesService } from 'src/auth/roles/roles.service';
import { Role } from 'src/enums/role.enum';
import { Permissions } from 'src/auth/constants/permissions.constants';

@Injectable()
export class NotificationListenerService implements OnModuleInit {
  constructor(
    private readonly notificationEvents: NotificationEventsService,
    private readonly notificationsService: NotificationsService,
    private readonly rolesService: RolesService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

   onModuleInit() {
     Object.values(NotificationEvents).forEach((eventName) => {
       this.notificationEvents.on(eventName, async (payload) => {
         const recipients = Array.from(new Set((payload.recipients || []).filter(Boolean)));
         for (const recipient of recipients) {
           const authorized = await this.canReceiveNotification(
             recipient,
             payload.type,
             payload.relatedId,
           );
           if (!authorized) {
             continue;
           }
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

  private async canReceiveNotification(
    userId: string,
    type: string,
    relatedId?: string,
  ): Promise<boolean> {
    const userModel = this.connection.model('User');
    const taskModel = this.connection.model('Task');
    const projectModel = this.connection.model('Project');
    const teamModel = this.connection.model('Team');

    const user = await userModel.findById(userId).select('roles permissions').lean();
    if (!user) return false;

    const userRoles = ((user as any).roles || []).map((r: string) => r.toLowerCase());
    const effectivePermissions = await this.rolesService.buildEffectivePermissions(
      (user as any).roles || [],
      (user as any).permissions || [],
    );

    if (userRoles.includes(Role.SUPER_ADMIN) || userRoles.includes(Role.ADMIN)) {
      return true;
    }

    const hasAny = (...perms: string[]) => perms.some((p) => effectivePermissions.includes(p));

    if (type.startsWith('team.')) {
      if (!relatedId) return false;
      const team = await teamModel.findById(relatedId).select('manager members').lean();
      if (!team) return false;
      const managerId = (team as any).manager?.toString?.();
      const memberIds = ((team as any).members || []).map((m: any) => m.toString());
      return (
        hasAny(Permissions.TEAMS_VIEW, Permissions.TEAMS_VIEW_ALL) &&
        (effectivePermissions.includes(Permissions.TEAMS_VIEW_ALL) ||
          managerId === userId ||
          memberIds.includes(userId))
      );
    }

    if (type.startsWith('project.')) {
      if (!relatedId) return false;
      const project = await projectModel.findById(relatedId).select('team createdBy').lean();
      if (!project) return false;
      const team = await teamModel.findById((project as any).team).select('members manager').lean();
      const projectCreatorId = (project as any).createdBy?.toString?.();
      const managerId = (team as any)?.manager?.toString?.();
      const memberIds = (((team as any)?.members || []) as any[]).map((m) => m.toString());
      return (
        hasAny(Permissions.PROJECTS_VIEW, Permissions.PROJECTS_VIEW_ALL) &&
        (effectivePermissions.includes(Permissions.PROJECTS_VIEW_ALL) ||
          projectCreatorId === userId ||
          managerId === userId ||
          memberIds.includes(userId))
      );
    }

    if (type.startsWith('task.') || type.startsWith('comment.')) {
      if (!relatedId) return false;
      const task = await taskModel.findById(relatedId).select('project assignedTo createdBy status dueDate').lean();
      if (!task) return false;
      const project = await projectModel.findById((task as any).project).select('team createdBy').lean();
      const team = project
        ? await teamModel.findById((project as any).team).select('members manager').lean()
        : null;
      const assignedIds = (((task as any).assignedTo || []) as any[]).map((a) => a.toString());
      const managerId = (team as any)?.manager?.toString?.();
      const memberIds = (((team as any)?.members || []) as any[]).map((m) => m.toString());
      const projectCreatorId = (project as any)?.createdBy?.toString?.();

      const canSeeTask =
        hasAny(Permissions.TASKS_VIEW, Permissions.TASKS_VIEW_ALL) &&
        (effectivePermissions.includes(Permissions.TASKS_VIEW_ALL) ||
          assignedIds.includes(userId) ||
          managerId === userId ||
          projectCreatorId === userId ||
          memberIds.includes(userId));

      if (!canSeeTask) return false;

      // Tester-targeted notification gate for QA/review flows.
      const qaRelated =
        type === 'task.testing_requested' ||
        type === 'task.bug_reopened' ||
        (type === 'task.updated' && (task as any).status === 'in_review');
      if (qaRelated) {
        const hasTesterRole = userRoles.includes(Role.TESTER);
        const hasTesterPerm = hasAny(
          Permissions.TASKS_TEST_UPDATE,
          Permissions.TEST_TASK,
          Permissions.REPORT_BUG,
          Permissions.VERIFY_TASK,
        );
        return hasTesterRole || hasTesterPerm || managerId === userId;
      }

      return true;
    }

    // Fallback deny for unknown notification types to avoid unauthorized exposure.
    return false;
  }
}
