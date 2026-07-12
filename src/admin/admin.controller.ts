import { Controller, Get, Patch, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { UserRole } from '../auth/user.entity';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  // ===== 我的菜单（任意登录用户）=====
  @Get('menu-config/me')
  getMyMenuConfig(@Req() req) {
    return this.service.getMenuConfig(req.user.role || 'user');
  }

  // ===== 管理员接口 =====
  @Get('admin/users')
  listUsers(@Req() req) {
    return this.service.findAllUsers(req.user.id);
  }

  // 修改用户信息（角色/昵称/用户名）
  @Patch('admin/users/:id')
  updateUser(@Req() req, @Param('id') id: number, @Body() body: { role?: UserRole; nickname?: string; username?: string }) {
    return this.service.updateUser(req.user.id, id, body);
  }

  // 获取所有角色菜单配置
  @Get('admin/menu-config')
  getMenuConfigs(@Req() req) {
    return this.service.getAllMenuConfigs(req.user.id);
  }

  // 保存某角色菜单配置
  @Put('admin/menu-config/:role')
  saveMenuConfig(@Req() req, @Param('role') role: string, @Body() body: Record<string, any>) {
    return this.service.saveMenuConfig(req.user.id, role, body);
  }
}
