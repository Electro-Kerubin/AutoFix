import { Module } from '@nestjs/common';
import { GarantiasModule } from '../garantias/garantias.module';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

@Module({
  imports: [GarantiasModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
