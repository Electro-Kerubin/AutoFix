import { Module } from '@nestjs/common';
import { GarantiasModule } from '../garantias/garantias.module';
import { OrdenesTrabajoModule } from '../ordenes-trabajo/ordenes-trabajo.module';
import { PresupuestosModule } from '../presupuestos/presupuestos.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  imports: [OrdenesTrabajoModule, PresupuestosModule, GarantiasModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
