import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { UserRole } from '../auth/user.entity';
import type { AuthenticatedRequest } from '../common/authenticated-request';
import type { MenuConfig } from '../common/menu-config.types';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  // ===== 我的菜单（任意登录用户）=====
  @Get('menu-config/me')
  getMyMenuConfig(@Req() req: AuthenticatedRequest) {
    return this.service.getMenuConfig(req.user.role || 'user');
  }

  // ===== 管理员接口 =====
  @Get('admin/users')
  listUsers(@Req() req: AuthenticatedRequest) {
    return this.service.findAllUsers(req.user.id);
  }

  @Post('admin/users')
  createUser(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      username: string;
      nickname: string;
      role: string;
      password: string;
    },
  ) {
    return this.service.createUser(req.user.id, body);
  }

  @Delete('admin/users/:id')
  deleteUser(@Req() req: AuthenticatedRequest, @Param('id') id: number) {
    return this.service.deleteUser(req.user.id, id);
  }

  @Patch('admin/users/:id')
  updateUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: number,
    @Body() body: { role?: UserRole; nickname?: string; username?: string },
  ) {
    return this.service.updateUser(req.user.id, id, body);
  }

  @Get('admin/menu-config')
  getMenuConfigs(@Req() req: AuthenticatedRequest) {
    return this.service.getAllMenuConfigs(req.user.id);
  }

  @Put('admin/menu-config/:role')
  saveMenuConfig(
    @Req() req: AuthenticatedRequest,
    @Param('role') role: string,
    @Body() body: MenuConfig,
  ) {
    return this.service.saveMenuConfig(req.user.id, role, body);
  }
}
