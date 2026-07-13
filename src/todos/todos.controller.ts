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
import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { TodosService } from './todos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TodoStatus, TodoCycle } from './todo.entity';
import type { AuthenticatedRequest } from '../common/authenticated-request';

export class CreateTodoDto {
  @IsOptional()
  @IsInt()
  taskId?: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(TodoStatus)
  status?: TodoStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TodoCycle)
  cycle?: TodoCycle;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateTodoDto {
  @IsOptional()
  @IsInt()
  taskId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(TodoStatus)
  status?: TodoStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TodoCycle)
  cycle?: TodoCycle;

  @IsOptional()
  @IsString()
  remark?: string;
}

@Controller('api/v1/todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('task_id') taskId?: string,
    @Query('status') status?: TodoStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.todosService.findAll(req.user.id, {
      taskId: taskId ? +taskId : undefined,
      status,
      page: page ? +page : undefined,
      pageSize: pageSize ? +pageSize : undefined,
    });
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.todosService.findOne(req.user.id, +id);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTodoDto) {
    return this.todosService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ) {
    return this.todosService.update(req.user.id, +id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.todosService.remove(req.user.id, +id);
  }
}
