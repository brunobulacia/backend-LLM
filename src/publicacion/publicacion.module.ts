import { Module } from '@nestjs/common';
import { PublicacionService } from './publicacion.service';
import { PublicacionController } from './publicacion.controller';

@Module({
  controllers: [PublicacionController],
  providers: [PublicacionService],
})
export class PublicacionModule {}
