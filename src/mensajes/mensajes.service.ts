import { Injectable } from '@nestjs/common';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MensajesService {
  constructor(private readonly prismaService: PrismaService) {}
  create(createMensajeDto: CreateMensajeDto) {
    return this.prismaService.mensaje.create({ data: createMensajeDto });
  }

  findAll() {
    return this.prismaService.mensaje.findMany();
  }

  findOne(id: string) {
    return this.prismaService.mensaje.findUnique({ where: { id } });
  }

  update(id: string, updateMensajeDto: UpdateMensajeDto) {
    return this.prismaService.mensaje.update({
      where: { id },
      data: updateMensajeDto,
    });
  }

  remove(id: string) {
    return this.prismaService.mensaje.delete({ where: { id } });
  }

  //GET MENSAJES BY CHAT ID
  async findByChatId(chatId: string) {
    console.log(`🔍 [DEBUG] Buscando mensajes para chat: ${chatId}`);
    const mensajes = await this.prismaService.mensaje.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📋 [DEBUG] Mensajes encontrados: ${mensajes.length}`);
    mensajes.forEach((msg, index) => {
      if (msg.tipo === 'CONTENIDO_REDES_SOCIALES') {
        console.log(`📱 [DEBUG] Mensaje ${index + 1} (SOCIAL):`, {
          id: msg.id,
          tipo: msg.tipo,
          rutaImagen: msg.rutaImagen,
          imagenGenerada: msg.imagenGenerada,
          contenido: msg.contenido.substring(0, 50) + '...',
        });
      }
    });

    return mensajes;
  }
}
