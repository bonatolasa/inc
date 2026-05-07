import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { UsersService } from 'src/users/services/users.service';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
  ) {
    const strategyOptions: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    };
    super(strategyOptions);
  }

  async validate(payload: any) {
    this.logger.log(`JWT payload: ${JSON.stringify(payload)}`);
    
    const { sub, roles, permissions, ...rest } = payload;

    if (!sub) {
      this.logger.warn('No sub in JWT payload');
      throw new UnauthorizedException('Invalid token');
    }

    // Always fetch fresh permissions from database to ensure they're up-to-date
    const user = await this.usersService.findByIdWithPassword?.(sub);
    
    if (!user) {
      this.logger.warn(`User not found for sub: ${sub}`);
      throw new UnauthorizedException('User not found');
    }

    let userRoles: string[] = [];
    let userPermissions: string[] = [];

    if (user) {
      userRoles = user.roles;
      userPermissions = await this.rolesService.buildEffectivePermissions(
        userRoles,
        user.permissions || [],
      );
    }

    this.logger.log(`Validated user: ${user.email}, roles: ${JSON.stringify(userRoles)}`);

    const normalizedRoles = userRoles?.map((r: string) => r.toLowerCase()) || [];

    return {
      id: sub,
      role: normalizedRoles[0],
      roles: normalizedRoles,
      permissions: userPermissions || [],
      ...rest 
    };
  }
}
