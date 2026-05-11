import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoleDocument } from './roles.schema';
import { ROLE_PERMISSIONS, Permissions } from '../constants/permissions.constants';
import { Role } from 'src/enums/role.enum';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectModel(RoleDocument.name)
    private readonly roleModel: Model<RoleDocument>,
  ) { }

  async onModuleInit() {
    // Default display names for system roles
    const DEFAULT_DISPLAY_NAMES: Record<string, string> = {
      [Role.SUPER_ADMIN]: 'Super Admin',
      [Role.ADMIN]: 'Admin',
      [Role.PROJECT_MANAGER]: 'Project Manager',
      [Role.TESTER]: 'Tester',
      [Role.TEAM_MEMBER]: 'Team Member',
    };

    const seedEntries = Object.entries(ROLE_PERMISSIONS);
    const seedRoleNames = seedEntries.map(([role]) => role);
    const existingRoles = await this.roleModel
      .find({ name: { $in: seedRoleNames } })
      .select('name')
      .lean();
    const existingRoleNames = new Set(existingRoles.map((role) => role.name));

    await Promise.all(
      seedEntries
        .filter(([role]) => !existingRoleNames.has(role))
        .map(async ([role, permissions]) => {
          const displayName =
            DEFAULT_DISPLAY_NAMES[role] ||
            role
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

          await this.roleModel.create({
            name: role,
            displayName,
            permissions: Array.from(new Set(permissions)),
          });
        }),
    );
    this.logger.log('Default roles seeded (create-if-missing only)');
  }

  async getPermissionsForRoles(roleNames: Array<string | Role>): Promise<string[]> {
    const normalized = Array.from(
      new Set(
        (roleNames || [])
          .map((role) => this.normalizeName(String(role)))
          .filter((role) => !!role),
      ),
    );
    if (!normalized.length) {
      return [];
    }

    const roleDocs = await this.roleModel.find({ name: { $in: normalized } }).exec();
    const permissionSet = new Set<string>();
    roleDocs.forEach((roleDoc) => {
      roleDoc.permissions.forEach((permission) => permissionSet.add(permission));
    });

    return Array.from(permissionSet);
  }

  async buildEffectivePermissions(
    roleNames: Array<string | Role>,
    directPermissions: string[] = [],
  ): Promise<string[]> {
    const rolePermissions = await this.getPermissionsForRoles(roleNames);
    const normalizedDirectPermissions = (directPermissions || [])
      .map((p) => p?.toString().trim())
      .filter((p) => !!p);
    return Array.from(new Set([...rolePermissions, ...normalizedDirectPermissions]));
  }

  async getByName(roleName: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name: roleName.toLowerCase() }).exec();
  }

  async getAllRoles(): Promise<RoleDocument[]> {
    return this.roleModel.find().sort({ name: 1 }).exec();
  }

  async createRole(name: string, displayName?: string, description?: string): Promise<RoleDocument> {
    const normalized = this.normalizeName(name);
    const existing = await this.getByName(normalized);
    if (existing) {
      throw new BadRequestException(`Role "${normalized}" already exists`);
    }
    
    // Generate display name if not provided
    const finalDisplayName = displayName || name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    return this.roleModel.create({
      name: normalized,
      displayName: finalDisplayName,
      description,
      permissions: [],
    });
  }

  async updateDisplayName(name: string, displayName: string): Promise<RoleDocument> {
    const role = await this.getExistingRole(name);
    role.displayName = displayName.trim();
    return role.save();
  }

  async deleteRole(name: string): Promise<void> {
    const normalized = this.normalizeName(name);
    if (normalized === Role.SUPER_ADMIN) {
      throw new BadRequestException('SUPER_ADMIN role cannot be deleted');
    }
    const result = await this.roleModel.deleteOne({ name: normalized }).exec();
    if (!result.deletedCount) {
      throw new NotFoundException(`Role "${normalized}" not found`);
    }
  }

  async addPermissions(name: string, permissions: string[]): Promise<RoleDocument> {
    const role = await this.getExistingRole(name);
    const normalized = this.normalizePermissions(permissions);

    const merged = new Set([...(role.permissions || []), ...normalized]);
    role.permissions = Array.from(merged);

    return role.save();
  }

  async removePermissions(
    name: string,
    permissions: string[],
  ): Promise<RoleDocument> {
    const role = await this.getExistingRole(name);
    const normalized = this.normalizePermissions(permissions);

    const removeSet = new Set(normalized);
    role.permissions = (role.permissions || []).filter((p) => !removeSet.has(p));
    return role.save();
  }

  private normalizePermissions(permissions: string[]): string[] {
    const permissionMap = Permissions as Record<string, string>;
    const validPermissions = Object.values(Permissions) as string[];

    const normalized = permissions.map((p) => {
      // Convert CONSTANT → value (USERS_CREATE → users.create)
      if (permissionMap[p]) return permissionMap[p];

      // Normalize lowercase input
      return p.toLowerCase().trim();
    });

    // Filter only valid permissions
    return normalized.filter((p) => validPermissions.includes(p));
  }

  private async getExistingRole(name: string): Promise<RoleDocument> {
    const normalized = this.normalizeName(name);
    const role = await this.getByName(normalized);
    if (!role) {
      throw new NotFoundException(`Role "${normalized}" not found`);
    }
    return role;
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '_');
  }
}
