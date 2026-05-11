import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PermissionDocument } from './schemas/permission.schema';
import { Permissions } from 'src/auth/constants/permissions.constants';

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(
    @InjectModel(PermissionDocument.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async onModuleInit() {
    const values = Array.from(new Set(Object.values(Permissions)));
    const existingPermissions = await this.permissionModel
      .find({ name: { $in: values } })
      .select('name')
      .lean();
    const existingNames = new Set(existingPermissions.map((permission) => permission.name));

    const missingPermissions = values.filter((permission) => !existingNames.has(permission));
    if (!missingPermissions.length) {
      return;
    }

    await this.permissionModel.insertMany(
      missingPermissions.map((name) => ({ name })),
      { ordered: false },
    );
  }

  async create(name: string, description?: string): Promise<PermissionDocument> {
    const normalized = this.normalize(name);
    const existing = await this.permissionModel.findOne({ name: normalized });
    if (existing) {
      throw new BadRequestException(`Permission "${normalized}" already exists`);
    }
    return this.permissionModel.create({ name: normalized, description });
  }

  async list(): Promise<PermissionDocument[]> {
    return this.permissionModel.find().sort({ name: 1 }).exec();
  }

  async getByName(name: string): Promise<PermissionDocument> {
    const permission = await this.permissionModel
      .findOne({ name: this.normalize(name) })
      .exec();
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  private normalize(name: string): string {
    return name.toLowerCase().trim();
  }
}
