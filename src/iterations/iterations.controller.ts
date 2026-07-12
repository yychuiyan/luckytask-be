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
  IsInt,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IterationsService } from './iterations.service';
import { IterationStatus } from './iteration.entity';

export class CreateIterationDto {
  @IsInt()
  projectId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(IterationStatus)
  status?: IterationStatus;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateIterationDto {
  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(IterationStatus)
  status?: IterationStatus;

  @IsOptional()
  @IsString()
  remark?: string;
}

@Controller('api/v1/iterations')
@UseGuards(JwtAuthGuard)
export class IterationsController {
  constructor(private readonly service: IterationsService) {}

  @Get()
  findAll(
    @Req() req,
    @Query('projectId') projectId?: number,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll(
      req.user.id,
      projectId,
      page ? +page : 1,
      pageSize ? +pageSize : 10,
    );
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: number) {
    return this.service.findOne(req.user.id, id);
  }

  @Post()
  create(@Req() req, @Body() dto: CreateIterationDto) {
    return this.service.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: number, @Body() dto: UpdateIterationDto) {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: number) {
    return this.service.remove(req.user.id, id);
  }
}
