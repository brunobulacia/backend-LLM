import { Module } from '@nestjs/common';
import { SocketChatModule } from './socket-chat/socket-chat.module';
import { PublicacionModule } from './publicacion/publicacion.module';
import { MensajesModule } from './mensajes/mensajes.module';
import { ChatsModule } from './chats/chats.module';

@Module({
  imports: [SocketChatModule, PublicacionModule, MensajesModule, ChatsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
