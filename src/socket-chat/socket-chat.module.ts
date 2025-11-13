import { Module } from '@nestjs/common';
import { SocketChatService } from './socket-chat.service';
import { SocketChatGateway } from './socket-chat.gateway';
import { MensajesModule } from 'src/mensajes/mensajes.module';

@Module({
  providers: [SocketChatGateway, SocketChatService],
  imports: [MensajesModule],
})
export class SocketChatModule {}
