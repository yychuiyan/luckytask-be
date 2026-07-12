import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/task.entity';
import { Todo } from '../todos/todo.entity';
import { Project } from '../projects/project.entity';
import { Memo } from '../memos/memo.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Todo, Project, Memo])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
