import { Module } from '@nestjs/common';
import { SocketChatService } from './socket-chat.service';
import { SocketChatGateway } from './socket-chat.gateway';
import { MensajesModule } from 'src/mensajes/mensajes.module';
import { RedesSocialesModule } from '../redes-sociales/redes-sociales.module';
import { VideosModule } from '../videos/videos.module';

@Module({
  providers: [SocketChatGateway, SocketChatService],
  imports: [MensajesModule, RedesSocialesModule, VideosModule],
})
export class SocketChatModule {}
