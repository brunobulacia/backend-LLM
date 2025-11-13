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
import { MensajesService } from 'src/mensajes/mensajes.service';

//IMPORT PARA OPENAI
import OpenAI from 'openai';

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
  constructor(
    private readonly socketChatService: SocketChatService,
    private readonly mensajesService: MensajesService,
  ) {}

  //CREAR NSTANCIA DE OLLAMA SIN API KEY
  ollama = new Ollama();

  //CREAR INSTANCIA DE OPENAI CON API KEY
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

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

  //PARA GENERAR EL CHAT PALABRA POR PALABRA EN TIEMPO REAL CON OPENAI
  @SubscribeMessage('prompt')
  async handlePrompt(
    @MessageBody() data: { chatId: string; prompt: string },
    client: Socket,
  ) {
    console.log('Chat ID:', data.chatId);
    console.log('Prompt recibido del cliente:', data.prompt);

    //THERES NOTHING U CAN TELL ME
    const createdMensaje = await this.mensajesService.create({
      contenido: data.prompt,
      chatId: data.chatId,
      emisor: 'USUARIO',
    });

    const response = await this.client.responses.create({
      model: 'gpt-5',
      input: [{ role: 'user', content: data.prompt }],
      stream: true,
    });

    //PARA RENDERIZAR PALABRA POR PALABRA EN TIEMPO REAL
    let message = '';
    for await (const event of response) {
      if (event.type === 'response.output_text.delta') {
        const textDelta = event.delta || '';
        message += textDelta;
        console.log(message);
        this.wss.emit('prompt-response', {
          respuesta: message,
        });
      }

      if (event.type === 'response.output_text.done') {
        console.log('Mensaje completo recibido:', event.text);
        message = event.text || message;
      }
    }

    //GUARDAR EL MENSAJE DEL FUCKING LLM EN LA BASE DE DATOS
    const createdMensajeIA = await this.mensajesService.create({
      contenido: message,
      chatId: data.chatId,
      emisor: 'LLM',
    });
  }

  /* OLLAMA */
  //PARA GENERAR EL CHAT PALABRA POR PALABRA EN TIEMPO REAL
  /*  @SubscribeMessage('prompt')
  async handlePrompt(
    @MessageBody() data: { chatId: string; prompt: string },
    client: Socket,
  ) {
    console.log('Chat ID:', data.chatId);
    console.log('Prompt recibido del cliente:', data.prompt);

    //THERES NOTHING U CAN TELL ME
    const createdMensaje = await this.mensajesService.create({
      contenido: data.prompt,
      chatId: data.chatId,
      emisor: 'USUARIO',
    });

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

    //GUARDAR EL MENSAJE DEL FUCKING LLM EN LA BASE DE DATOS
    const createdMensajeIA = await this.mensajesService.create({
      contenido: message,
      chatId: data.chatId,
      emisor: 'LLM',
    });
  } */
}
