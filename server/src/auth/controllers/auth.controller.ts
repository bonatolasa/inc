import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AcceptInviteDto, LoginDto, RegisterDto } from '../dtos/auth.dto';
import { AuthResponseDto } from '../responses/auth.response';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  async acceptInvite(
    @Body() acceptInviteDto: AcceptInviteDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.authService.acceptInvite(acceptInviteDto.token, acceptInviteDto.password);
    return {
      success: true,
      message: 'Invitation accepted. You can now sign in.',
    };
  }

  // we avoid using the guard here to prevent a 500 when the token is missing/invalid
  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  async verifyPassword(
    @Req() req: any,
    @Body('password') password: string,
  ): Promise<{ success: boolean; message: string }> {
    // manually extract token
    const authHeader = req.headers?.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authentication token provided');
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid auth header format');
    }
    let decoded: any;
    try {
      decoded = this.jwtService.verify(parts[1]);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = decoded.sub;
    const isValid = await this.authService.verifyPassword(userId, password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    return {
      success: true,
      message: 'Password verified',
    };
  }
}
