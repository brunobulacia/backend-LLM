import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ChatsController],
  providers: [ChatsService],
  imports: [PrismaModule],
})
export class ChatsModule {}
