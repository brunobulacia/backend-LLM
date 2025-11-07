import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() wss: Server;
  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.chatService.addClient(client);
    this.wss.emit('message', {
      conexiones: this.chatService.getClientCount(),
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    this.wss.emit('message', {
      conexiones: this.chatService.getClientCount(),
    });
  }

  @SubscribeMessage('hello-world')
  handleHelloWorld(client: Socket, payload: any) {
    console.log('Mensaje recibido del cliente:', payload);
    this.wss.emit('hello-world-message', {
      mensaje: payload.message,
    });
  }
}
