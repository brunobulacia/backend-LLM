import { Module } from '@nestjs/common';
import { RedesSocialesService } from './redes-sociales.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RedesSocialesService],
  exports: [RedesSocialesService],
})
export class RedesSocialesModule {}
