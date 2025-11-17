import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private readonly prismaService: PrismaService) {}
  create(createChatDto: CreateChatDto) {
    return this.prismaService.chat.create({ data: createChatDto });
  }

  findAll() {
    return this.prismaService.chat.findMany({ where: { isActive: true } });
  }

  findOne(id: string) {
    return this.prismaService.chat.findUnique({ where: { id } });
  }

  update(id: string, updateChatDto: UpdateChatDto) {
    return this.prismaService.chat.update({
      where: { id },
      data: updateChatDto,
    });
  }

  remove(id: string) {
    return this.prismaService.chat.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
