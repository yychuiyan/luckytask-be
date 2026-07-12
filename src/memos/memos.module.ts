import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Memo } from './memo.entity';
import { MemosController } from './memos.controller';
import { MemosService } from './memos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Memo])],
  controllers: [MemosController],
  providers: [MemosService],
})
export class MemosModule {}
