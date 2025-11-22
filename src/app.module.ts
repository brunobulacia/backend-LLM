import { Module } from '@nestjs/common';
import { SocketChatModule } from './socket-chat/socket-chat.module';
import { PublicacionModule } from './publicacion/publicacion.module';
import { MensajesModule } from './mensajes/mensajes.module';
import { ChatsModule } from './chats/chats.module';
import { ImagesModule } from './images/images.module';
import { RedesSocialesModule } from './redes-sociales/redes-sociales.module';
import { TiktokModule } from './tiktok/tiktok.module';

@Module({
  imports: [
    SocketChatModule,
    PublicacionModule,
    MensajesModule,
    ChatsModule,
    ImagesModule,
    RedesSocialesModule,
    TiktokModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
