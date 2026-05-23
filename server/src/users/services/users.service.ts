import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/users.schemas';
import { Project } from 'src/projects/schemas/project.schema';
import { CreateUserDto, UpdateUserDto } from '../dtos/users.dto';
import { UserResponseDto } from '../responses/users.response';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { InvitationEmailService } from './invitation-email.service';
import { InviteUserDto } from '../dtos/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    private invitationEmailService: InvitationEmailService,
  ) {}

  //create user with hashed password and check for duplicate email
  async createUsers(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Use role from form or default to team_member
    const roles = createUserDto.role 
      ? [createUserDto.role] 
      : (createUserDto.roles && createUserDto.roles.length > 0 
          ? createUserDto.roles 
          : ['team_member']);

    const createdUser = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      roles,
    });

    const savedUser = await createdUser.save();
    return this.mapToResponseDto(savedUser);
  }

  async inviteUser(inviteUserDto: InviteUserDto): Promise<{ user: UserResponseDto; emailSent: boolean }> {
    const normalizedEmail = inviteUserDto.email.toLowerCase();
    const existingUser = await this.userModel.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.invitationAcceptedAt) {
      throw new BadRequestException('Email already exists');
    }

    const rawToken = randomBytes(32).toString('hex');
    const invitationTokenHash = createHash('sha256').update(rawToken).digest('hex');
    const invitationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const inviteBaseUrl = process.env.INVITE_BASE_URL || 'http://localhost:5173/accept-invite';
    const inviteLink = `${inviteBaseUrl}?token=${encodeURIComponent(rawToken)}`;

    const roles = inviteUserDto.role
      ? [inviteUserDto.role]
      : inviteUserDto.roles && inviteUserDto.roles.length > 0
        ? inviteUserDto.roles
        : ['team_member'];

    let userDoc: User;
    if (existingUser) {
      existingUser.name = inviteUserDto.name;
      existingUser.roles = roles;
      existingUser.team = inviteUserDto.team as any;
      existingUser.invitationTokenHash = invitationTokenHash;
      existingUser.invitationExpiresAt = invitationExpiresAt;
      existingUser.invitationSentAt = new Date();
      existingUser.invitationAcceptedAt = undefined;
      userDoc = await existingUser.save();
    } else {
      const placeholderPassword = randomBytes(24).toString('hex');
      const hashedPassword = await bcrypt.hash(placeholderPassword, 10);
      const created = new this.userModel({
        ...inviteUserDto,
        email: normalizedEmail,
        password: hashedPassword,
        roles,
        invitationTokenHash,
        invitationExpiresAt,
        invitationSentAt: new Date(),
      });
      userDoc = await created.save();
    }

    const emailSent = await this.invitationEmailService.sendInviteEmail(
      normalizedEmail,
      inviteUserDto.name,
      inviteLink,
    );

    return {
      user: this.mapToResponseDto(userDoc),
      emailSent,
    };
  }

  async findByInvitationToken(token: string): Promise<User | null> {
    const invitationTokenHash = createHash('sha256').update(token).digest('hex');
    return this.userModel.findOne({ invitationTokenHash }).exec();
  }

  //Get all users with team name populated (with pagination)
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    filters?: { name?: string; role?: string },
  ): Promise<{ users: UserResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};
    const filterClauses: any[] = [];

    const nameFilter = filters?.name?.trim();
    const roleFilter = filters?.role?.trim().toLowerCase().replace(/\s+/g, '_');

    if (nameFilter) {
      const regex = { $regex: nameFilter, $options: 'i' };
      filterClauses.push({
        $or: [
          { name: regex },
          { email: regex },
        ],
      });
    }

    if (roleFilter && roleFilter !== 'all') {
      filterClauses.push({
        $or: [
          { roles: roleFilter },
          { 'roles.name': roleFilter },
        ],
      });
    }

    if (filterClauses.length > 0) {
      query.$and = filterClauses;
    }

    const [users, total] = await Promise.all([
      this.userModel.find(query).populate('team', 'name').skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users: users.map((user) => this.mapToResponseDto(user)),
      total,
    };
  }

  //Get user by Id with team name populated
  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userModel
      .findById(id)
      .populate('team', 'name')
      .exec();

    if (!user) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }

    return this.mapToResponseDto(user);
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  //UPDATE USER SERVICES
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Normalize roles if provided
    if (updateUserDto.roles) {
      updateUserDto.roles = updateUserDto.roles.map(r => r.toLowerCase().trim().replace(/\s+/g, '_'));
    }
    if (updateUserDto.role) {
      updateUserDto.role = updateUserDto.role.toLowerCase().trim().replace(/\s+/g, '_');
      updateUserDto.roles = [updateUserDto.role];
      delete updateUserDto.role;
    }

    //if email is being updated, check for duplication
    if (updateUserDto.email) {
      const normalizedEmail = updateUserDto.email.toLowerCase().trim();

      const existingUser = await this.userModel.findOne({
        email: normalizedEmail,
        _id: { $ne: id }, // Exclude current user from check
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      updateUserDto.email = normalizedEmail;
    }

    console.log('Updating user', { id, updateUserDto });
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, {
          new: true,
          runValidators: true,
        })
        .populate('team', 'name')
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const result = this.mapToResponseDto(updatedUser);
      console.log('User updated successfully', { userId: id });
      return result;
    } catch (err) {
      console.error('CRITICAL: Error in UsersService.updateUser', {
        id,
        updateUserDto,
        error: err,
      });
      throw err;
    }
  }

  //DELETE USER BYid
  async removeUser(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  //Get user by Role
  async getUsersByRole(role: string): Promise<UserResponseDto[]> {
    const users = await this.userModel
      .find({ roles: role })
      .populate('team', 'name')
      .exec();

    return users.map((user) => this.mapToResponseDto(user));
  }

  async getUsersByTeam(teamId: string): Promise<UserResponseDto[]> {
    const users = await this.userModel.find({ team: teamId }).exec();

    return users.map((user) => this.mapToResponseDto(user));
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        lastLogin: new Date(),
      })
      .exec();
  }

  async getManagerStats(): Promise<any[]> {
    const managers = await this.userModel.find({ roles: 'project_manager' }).exec();
    const stats = await Promise.all(
      managers.map(async (manager) => {
        const projectCount = await this.projectModel
          .countDocuments({ createdBy: manager._id })
          .exec();
        return {
          id: manager._id,
          name: manager.name,
          email: manager.email,
          projectCount,
        };
      }),
    );
    return stats;
  }

   async assignRoles(userId: string, roles: string[]): Promise<UserResponseDto> {
     const user = await this.userModel.findById(userId).exec();
     if (!user) {
       throw new NotFoundException(`User with ID ${userId} not found`);
     }

     const normalizedRoles = roles.map((r) => r.toLowerCase().trim().replace(/\s+/g, '_'));
     
     user.roles = normalizedRoles;
     await user.save();

     return this.mapToResponseDto(user);
   }

   async updateUserPermissions(userId: string, permissions: string[]): Promise<UserResponseDto> {
     const user = await this.userModel.findById(userId).exec();
     if (!user) {
       throw new NotFoundException(`User with ID ${userId} not found`);
     }

     // Normalize permissions (remove duplicates, empty strings)
     const normalizedPermissions = Array.from(new Set(
       permissions.map(p => p.trim()).filter(p => p)
     ));

     user.permissions = normalizedPermissions;
     await user.save();

     return this.mapToResponseDto(user);
   }

   private mapToResponseDto(user: User): UserResponseDto {
     let teamId: string | undefined;
     if (user.team) {
       if ((user.team as any)._id) {
         teamId = (user.team as any)._id.toString();
       } else {
         teamId = user.team.toString();
       }
     }

     return {
       id: user._id.toString(),
       name: user.name,
       email: user.email,
       roles: user.roles,
       permissions: user.permissions || [],
       team: teamId,
       isActive: user.isActive,
       lastLogin: user.lastLogin,
       createdAt: user.createdAt,
       updatedAt: user.updatedAt,
     };
   }
}
