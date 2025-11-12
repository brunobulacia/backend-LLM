import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { SocketChatService } from './socket-chat.service';
import { Server, Socket } from 'socket.io';
import { Ollama } from 'ollama';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/',
})
export class SocketChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;
  constructor(private readonly socketChatService: SocketChatService) {}

  //CREAR NSTANCIA DE OLLAMA SIN API KEY
  ollama = new Ollama();

  handleConnection(client: Socket) {
    this.socketChatService.addClient(client);
    this.wss.emit('message', {
      conexiones: this.socketChatService.getClientCount(),
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    this.wss.emit('message', {
      conexiones: this.socketChatService.getClientCount(),
    });
  }

  //PARA GENERAR EL CHAT PALABRA POR PALABRA EN TIEMPO REAL
  @SubscribeMessage('prompt')
  async handlePrompt(@MessageBody() data: { prompt: string }, client: Socket) {
    console.log('Prompt recibido del cliente:', data.prompt);
    const response = await this.ollama.chat({
      model: 'gpt-oss:120b-cloud',
      messages: [{ role: 'user', content: data.prompt }],
      stream: true,
    });
    let message = '';
    for await (const part of response) {
      process.stdout.write(part.message.content);
      message += part.message.content;
      this.wss.emit('prompt-response', {
        respuesta: message,
      });
    }
  }
}
