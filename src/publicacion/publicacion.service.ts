import { Injectable } from '@nestjs/common';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PublicacionService {
  constructor(private readonly prismaService: PrismaService) {}
  create(createPublicacionDto: CreatePublicacionDto) {
    return this.prismaService.publicacion.create({
      data: createPublicacionDto,
    });
  }

  findAll() {
    return this.prismaService.publicacion.findMany();
  }

  findOne(id: string) {
    return this.prismaService.publicacion.findUnique({ where: { id } });
  }

  update(id: string, updatePublicacionDto: UpdatePublicacionDto) {
    return this.prismaService.publicacion.update({
      where: { id },
      data: updatePublicacionDto,
    });
  }

  remove(id: string) {
    return this.prismaService.publicacion.delete({ where: { id } });
  }
}
