import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartaGantt } from './carta-gantt.entity';
import { CartasGanttController } from './cartas-gantt.controller';
import { CartasGanttService } from './cartas-gantt.service';

@Module({
  imports: [TypeOrmModule.forFeature([CartaGantt])],
  controllers: [CartasGanttController],
  providers: [CartasGanttService],
})
export class CartasGanttModule {}
