import { Module } from '@nestjs/common';
import { SocketChatService } from './socket-chat.service';
import { SocketChatGateway } from './socket-chat.gateway';

@Module({
  providers: [SocketChatGateway, SocketChatService],
})
export class SocketChatModule {}
