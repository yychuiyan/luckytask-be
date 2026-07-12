import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/authenticated-request';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nickname: string;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  captchaId: string;

  @IsString()
  captchaCode: string;
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.password, dto.nickname);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(
      dto.username,
      dto.password,
      dto.captchaId,
      dto.captchaCode,
    );
  }

  @Get('captcha')
  getCaptcha() {
    return this.authService.generateCaptcha();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.id);
  }
}
