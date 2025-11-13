import { Module } from '@nestjs/common';
import { MensajesService } from './mensajes.service';
import { MensajesController } from './mensajes.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [MensajesController],
  providers: [MensajesService],
  imports: [PrismaModule],
  exports: [MensajesService],
})
export class MensajesModule {}
