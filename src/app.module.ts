import { Module } from '@nestjs/common';
import { SocketChatModule } from './socket-chat/socket-chat.module';
import { PublicacionModule } from './publicacion/publicacion.module';
import { MensajesModule } from './mensajes/mensajes.module';
import { ChatsModule } from './chats/chats.module';
import { ImagesModule } from './images/images.module';
import { RedesSocialesModule } from './redes-sociales/redes-sociales.module';
import { TiktokModule } from './tiktok/tiktok.module';
import { VideosModule } from './videos/videos.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    SocketChatModule,
    PublicacionModule,
    MensajesModule,
    ChatsModule,
    ImagesModule,
    RedesSocialesModule,
    TiktokModule,
    VideosModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    /*  {
      //PARA PONER EL GUARD DE JWT EN TODOS LOS ENDPOINTS PERRITOUUUU
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    }, */
  ],
})
export class AppModule {}
