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
import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { ProjectStatus } from './project.entity';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

@Controller('api/v1/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  findAll(
    @Req() req,
    @Query('status') status?: ProjectStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll(
      req.user.id,
      status,
      page ? +page : 1,
      pageSize ? +pageSize : 10,
    );
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: number) {
    return this.service.findOne(req.user.id, id);
  }

  @Post()
  create(@Req() req, @Body() dto: CreateProjectDto) {
    return this.service.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: number, @Body() dto: UpdateProjectDto) {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: number) {
    return this.service.remove(req.user.id, id);
  }
}
