import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { MenuSettings } from './menu-settings.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, MenuSettings])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
