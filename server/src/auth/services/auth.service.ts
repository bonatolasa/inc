import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/schemas/users.schemas';
import { UsersService } from 'src/users/services/users.service';
import { RolesService } from '../roles/roles.service';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
import { AuthResponseDto } from '../responses/auth.response';
import * as bcrypt from 'bcryptjs';
import { CommonUtils } from 'src/commons/utils';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    private rolesService: RolesService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.createUsers({
      ...registerDto,
      roles:
        registerDto.roles && registerDto.roles.length > 0
          ? registerDto.roles
          : registerDto.role
            ? [registerDto.role]
            : undefined,
      role: registerDto.role,
    });

    // Effective permissions = role-based + direct user permissions
    const permissions = await this.rolesService.buildEffectivePermissions(
      user.roles,
      user.permissions || [],
    );

    // Generate token
    const jwtData = { 
      sub: user.id, 
      email: user.email, 
      roles: user.roles,
      permissions 
    };
    const accessToken = CommonUtils.generateJwtToken(jwtData);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          permissions,
          team: user.team,
        },
        accessToken,
      },
      message: 'Registration successful',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.invitationTokenHash) {
      throw new UnauthorizedException('Please accept your invitation from email before signing in');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    await this.usersService.updateLastLogin(user._id.toString());

    // Effective permissions = role-based + direct user permissions
    const permissions = await this.rolesService.buildEffectivePermissions(
      user.roles,
      user.permissions || [],
    );

    // Generate token
    const JwtLoginData = {
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles,
      permissions,
    };
    const accessToken = CommonUtils.generateJwtToken(JwtLoginData);

    return {
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          roles: user.roles,
          permissions,
          team: user.team ? (user.team as any)._id?.toString() : undefined,
        },
        accessToken,
      },
      message: 'Login successful',
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await this.usersService.findByIdWithPassword(userId);
      if (!user || !user.password) return false;
      const isValid = await bcrypt.compare(password, user.password);
      return isValid;
    } catch (error) {
      console.error('Error verifying password for user', userId, ':', error);
      return false;
    }
  }

  async acceptInvite(token: string, password: string): Promise<void> {
    const user = await this.usersService.findByInvitationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid invitation token');
    }

    if (!user.invitationExpiresAt || user.invitationExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invitation token has expired');
    }

    user.password = await bcrypt.hash(password, 10);
    user.invitationAcceptedAt = new Date();
    user.invitationTokenHash = undefined;
    user.invitationExpiresAt = undefined;
    await user.save();
  }
}
