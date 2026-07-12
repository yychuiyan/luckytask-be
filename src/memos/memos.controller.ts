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
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MemosService } from './memos.service';

export class CreateMemoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  folder?: string;

  @IsOptional()
  @IsInt()
  projectId?: number;
}

export class UpdateMemoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  folder?: string;

  @IsOptional()
  @IsInt()
  projectId?: number;
}

@Controller('api/v1/memos')
@UseGuards(JwtAuthGuard)
export class MemosController {
  constructor(private readonly service: MemosService) {}

  @Get()
  findAll(
    @Req() req,
    @Query('folder') folder?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll(req.user.id, {
      folder,
      keyword,
      page: page ? +page : undefined,
      pageSize: pageSize ? +pageSize : undefined,
    });
  }

  @Get('folders')
  getFolders(@Req() req) {
    return this.service.getFolders(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: number) {
    return this.service.findOne(req.user.id, id);
  }

  @Post()
  create(@Req() req, @Body() dto: CreateMemoDto) {
    return this.service.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: number, @Body() dto: UpdateMemoDto) {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: number) {
    return this.service.remove(req.user.id, id);
  }
}
