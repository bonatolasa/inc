import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  ACCESS_CONTROL_KEY,
  AccessControlContext,
  AccessControlMetadata,
  DEFAULT_ELEVATED_ROLES,
  PERMISSIONS_KEY,
} from '../constants/guard.constants';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { RolesService } from '../roles/roles.service';
import { normalizeRoles } from '../utils/role.utils';
import { Permissions } from '../constants/permissions.constants';

interface AuthenticatedRequest {
  user?: {
    id?: string;
    roles?: string[];
    permissions?: string[];
  };
  params?: Record<string, string>;
  body?: Record<string, any>;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const accessControl =
      this.reflector.getAllAndOverride<AccessControlMetadata | undefined>(
        ACCESS_CONTROL_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? {};

    const requiredPermissions =
      accessControl.permissions ??
      this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    const requiredRoles =
      accessControl.roles ??
      this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    const elevatedRoles = accessControl.elevatedRoles ?? DEFAULT_ELEVATED_ROLES;

    if (
      (!requiredPermissions || requiredPermissions.length === 0) &&
      (!requiredRoles || requiredRoles.length === 0) &&
      !accessControl.context
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user?.id) {
      this.logger.warn('Access denied: missing authenticated user.');
      return false;
    }

    const normalizedUserRoles = normalizeRoles(user.roles || []);
    const normalizedRequiredRoles = normalizeRoles(requiredRoles || []);
    const normalizedElevatedRoles = normalizeRoles(elevatedRoles);

    const hasElevatedRole = normalizedUserRoles.some((role) =>
      normalizedElevatedRoles.includes(role),
    );
    if (hasElevatedRole) {
      return true;
    }

    const hasRequiredRole =
      normalizedRequiredRoles.length === 0 ||
      normalizedUserRoles.some((role) => normalizedRequiredRoles.includes(role));

     let userPermissions = user.permissions || [];
     if (normalizedUserRoles.length > 0) {
       const rolePermissions = await this.rolesService.getPermissionsForRoles(
         normalizedUserRoles,
       );
       // Combine direct permissions and role-based permissions, removing duplicates
       userPermissions = [...new Set([...userPermissions, ...rolePermissions])];
     }

    const normalizedUserPermissions = new Set(
      userPermissions.map((perm) => perm.toLowerCase()),
    );

    const hasPermissionMatch = (requiredPermission: string): boolean => {
      const normalizedRequired = requiredPermission.toLowerCase();
      if (normalizedUserPermissions.has('all') || normalizedUserPermissions.has('*')) {
        return true;
      }
      if (normalizedUserPermissions.has(normalizedRequired)) {
        return true;
      }
      if (normalizedRequired.endsWith('.view')) {
        const viewAllPermission = `${normalizedRequired}.all`;
        if (normalizedUserPermissions.has(viewAllPermission)) {
          return true;
        }
      }
      return false;
    };

    const hasRequiredPermission =
      !requiredPermissions?.length ||
      requiredPermissions.some((permission) => hasPermissionMatch(permission));

    // OR mode: allow if either role or permission matches
    const requireAll = accessControl.requireAll !== undefined ? accessControl.requireAll : true;
    if (!requireAll) {
      if (!hasRequiredRole && !hasRequiredPermission) {
        return false;
      }
      return this.checkContext(accessControl.context, request);
    }

    // AND mode (default): must have both
    if (!hasRequiredRole || !hasRequiredPermission) {
      return false;
    }
    return this.checkContext(accessControl.context, request);
  }

  private async checkContext(
    contextConfig: AccessControlContext | undefined,
    request: AuthenticatedRequest,
  ): Promise<boolean> {
    if (!contextConfig?.check || !request.user?.id) {
      return true;
    }

    if (contextConfig.check === 'team_member') {
      const teamId =
        request.params?.[contextConfig.teamIdParam || 'teamId'] ||
        (contextConfig.projectIdBodyField
          ? request.body?.[contextConfig.projectIdBodyField]
          : undefined);
      if (!teamId) return false;
      const teamModel = this.connection.model('Team');
      const team = await teamModel.findById(teamId).select('members').lean();
      if (!team) return false;
      return (((team as any)?.members || []) as any[]).some(
        (member: any) => member.toString() === request.user!.id,
      );
    }

    if (contextConfig.check === 'project_member') {
      const projectIdFromParams =
        request.params?.[contextConfig.projectIdParam || 'id'];
      const projectIdFromBody = contextConfig.projectIdBodyField
        ? request.body?.[contextConfig.projectIdBodyField]
        : undefined;
      const projectId = projectIdFromParams || projectIdFromBody;
      if (!projectId) return false;

      const projectModel = this.connection.model('Project');
      const project = await projectModel
        .findById(projectId)
        .populate('team', 'members')
        .select('team')
        .lean();
      const teamMembers = ((project as any)?.team?.members || []) as any[];
      return teamMembers.some((member) => member.toString() === request.user!.id);
    }

    if (contextConfig.check === 'task_access') {
      const normalizedUserRoles = normalizeRoles(request.user?.roles || []);
      const directPermissions = request.user?.permissions || [];
      const testerPermissionSet = new Set([
        Permissions.TASKS_TEST_UPDATE,
        Permissions.TEST_TASK,
        Permissions.REPORT_BUG,
        Permissions.VERIFY_TASK,
      ]);
      const hasTesterRole = normalizedUserRoles.includes(Role.TESTER);
      const hasTesterPermission = directPermissions.some((p) =>
        testerPermissionSet.has(p as any),
      );

      // Testers can perform QA actions across tasks when authorized by role/permission.
      if (hasTesterRole || hasTesterPermission) {
        return true;
      }

      const taskId = request.params?.[contextConfig.taskIdParam || 'id'];
      if (!taskId) return false;

      const taskModel = this.connection.model('Task');
      const task = await taskModel
        .findById(taskId)
        .populate({
          path: 'project',
          select: 'createdBy',
        })
        .select('assignedTo project')
        .lean();
      if (!task) return false;

      const assignedToId = (task as any).assignedTo?.toString?.();
      const managerId = (task as any).project?.createdBy?.toString?.();
      return assignedToId === request.user!.id || managerId === request.user!.id;
    }

    return true;
  }
}
