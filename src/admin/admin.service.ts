import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../auth/user.entity';
import { MenuSettings } from './menu-settings.entity';

// 菜单权限项
interface MenuPerm {
  read: boolean;
  write: boolean;
  label: string;
  children?: Record<string, MenuPerm>;
}

// 默认菜单配置
const DEFAULT_MENU: Record<string, MenuPerm> = {
  dashboard: { read: true, write: false, label: '工作台' },
  todos: { read: true, write: true, label: '待办事项' },
  tasks: { read: true, write: true, label: '任务列表' },
  projects: {
    read: true, write: true, label: '项目管理',
    children: {
      projects_list: { read: true, write: true, label: '项目列表' },
      iterations: { read: true, write: true, label: '迭代管理' },
      requirements: { read: true, write: true, label: '需求管理' },
      bugs: { read: true, write: true, label: '缺陷管理' },
      board: { read: true, write: true, label: '项目看板' },
    },
  },
  repos: { read: true, write: false, label: 'GitHub 仓库' },
  settings: { read: false, write: false, label: '系统设置' },
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(MenuSettings)
    private readonly menuRepo: Repository<MenuSettings>,
  ) {}

  // ===== 用户管理 =====
  async findAllUsers(adminUserId: number) {
    await this.ensureAdmin(adminUserId);
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' } });
    return users.map(({ passwordHash, ...rest }) => rest);
  }

  async updateUser(adminUserId: number, targetUserId: number, data: { role?: UserRole; nickname?: string; username?: string }) {
    await this.ensureAdmin(adminUserId);
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('用户不存在');
    if (data.role) user.role = data.role;
    if (data.nickname) user.nickname = data.nickname;
    if (data.username) {
      const exists = await this.userRepo.findOne({ where: { username: data.username } });
      if (exists && exists.id !== targetUserId) throw new NotFoundException('用户名已存在');
      user.username = data.username;
    }
    return this.userRepo.save(user);
  }

  // ===== 菜单配置 =====
  async getMenuConfig(role: string) {
    const setting = await this.menuRepo.findOne({ where: { role } });
    const config = setting?.config || { ...DEFAULT_MENU };
    // 管理员系统设置始终开启
    if (role === UserRole.ADMIN && config.settings) {
      config.settings = { ...config.settings, read: true, write: true };
    }
    return config;
  }

  async getAllMenuConfigs(adminUserId: number) {
    await this.ensureAdmin(adminUserId);
    const roles = [UserRole.ADMIN, UserRole.USER, UserRole.GUEST];
    const result: Record<string, any> = {};
    for (const role of roles) {
      result[role] = await this.getMenuConfig(role);
    }
    return result;
  }

  async saveMenuConfig(adminUserId: number, role: string, config: Record<string, any>) {
    await this.ensureAdmin(adminUserId);
    let setting = await this.menuRepo.findOne({ where: { role } });
    if (!setting) {
      setting = this.menuRepo.create({ role, config });
    } else {
      setting.config = config;
    }
    return this.menuRepo.save(setting);
  }

  private async ensureAdmin(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('需要管理员权限');
    }
  }
}
