import { Module } from '@nestjs/common';
import { PublicacionService } from './publicacion.service';
import { PublicacionController } from './publicacion.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [PublicacionController],
  providers: [PublicacionService],
  imports: [PrismaModule],
})
export class PublicacionModule {}
