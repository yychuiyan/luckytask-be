import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TaskStatus, TaskPriority, TaskCycle } from './task.entity';
import type { AuthenticatedRequest } from '../common/authenticated-request';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TaskCycle)
  cycle?: TaskCycle;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TaskCycle)
  cycle?: TaskCycle;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

@Controller('api/v1/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: string,
    @Query('assignee') assignee?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.tasksService.findAll(req.user.id, {
      status,
      priority,
      assignee,
      keyword,
      page: page ? +page : undefined,
      pageSize: pageSize ? +pageSize : undefined,
    });
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.tasksService.findOne(req.user.id, +id);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(req.user.id, +id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.tasksService.remove(req.user.id, +id);
  }

  @Get(':id/stats')
  getStats(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.tasksService.getStats(req.user.id, +id);
  }
}
