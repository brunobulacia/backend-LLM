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
import { MensajesService } from 'src/mensajes/mensajes.service';
import { systemPrompt } from './system-prompts/publicaciones.prompt';

//PARA MANEJAR LAS IMAGENES QUE SE VAYAN GENERANDO
import fs from 'fs';

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
    @MessageBody()
    data: { chatId: string; prompt: string; type?: 'text' | 'image' },
    client: Socket,
  ) {
    console.log('Chat ID:', data.chatId);
    console.log('Prompt recibido del cliente:', data.prompt);
    console.log('Tipo de contenido:', data.type || 'text');

    // Guardar el mensaje del usuario
    const createdMensaje = await this.mensajesService.create({
      contenido: data.prompt,
      chatId: data.chatId,
      emisor: 'USUARIO',
      tipo: 'TEXTO',
    });

    // Determinar si es una solicitud de imagen basándose en palabras clave
    const isImageRequest =
      data.type === 'image' ||
      // Patrones más flexibles para detectar solicitudes de imagen
      /genera\w*\s*(me\s*)?(una?\s*)?(imagen|foto|picture|dibujo|ilustración)/i.test(
        data.prompt,
      ) ||
      /crear?\s*(una?\s*)?(imagen|foto|picture|dibujo|ilustración)/i.test(
        data.prompt,
      ) ||
      /hace?\s*(una?\s*)?(imagen|foto|picture|dibujo|ilustración)/i.test(
        data.prompt,
      ) ||
      /diseña\s*(una?\s*)?(imagen|foto|picture|dibujo|ilustración)/i.test(
        data.prompt,
      ) ||
      /dibuja\s*(una?\s*)?(imagen|foto|picture|dibujo|ilustración)/i.test(
        data.prompt,
      ) ||
      // Variantes con "imagen" al inicio
      /imagen\s*(de|que|en\s*donde|con)/i.test(data.prompt) ||
      // Patrones sin "imagen" explícita pero que claramente piden contenido visual
      /(genera|crear|diseña|dibuja)\w*\s*(me\s*)?(un|una)\s*(logo|póster|banner|cartel|flyer|afiche)/i.test(
        data.prompt,
      );

    console.log('🔍 Evaluando si es solicitud de imagen:', isImageRequest);
    console.log('📝 Prompt analizado:', data.prompt);

    if (isImageRequest) {
      await this.handleImageGeneration(data.chatId, data.prompt);
    } else {
      await this.handleTextGeneration(data.chatId, data.prompt);
    }
  }

  private async handleTextGeneration(chatId: string, prompt: string) {
    const response = await this.client.responses.create({
      model: 'gpt-5',
      input: [
        { role: 'user', content: prompt },
        {
          role: 'system',
          content: systemPrompt,
        },
      ],
      stream: true,
    });

    // Para renderizar palabra por palabra en tiempo real
    let message = '';
    for await (const event of response) {
      if (event.type === 'response.output_text.delta') {
        const textDelta = event.delta || '';
        message += textDelta;
        console.log(message);
        this.wss.emit('prompt-response', {
          type: 'text',
          respuesta: message,
        });
      }

      if (event.type === 'response.output_text.done') {
        console.log('Mensaje completo recibido:', event.text);
        message = event.text || message;
      }
    }

    // Guardar el mensaje del LLM en la base de datos
    await this.mensajesService.create({
      contenido: message,
      chatId: chatId,
      emisor: 'LLM',
      tipo: 'TEXTO',
    });
  }

  private async handleImageGeneration(chatId: string, prompt: string) {
    const imageModels = [
      {
        name: 'dall-e-3',
        config: {
          model: 'dall-e-3' as const,
          prompt: prompt,
          n: 1,
          size: '1024x1024' as const,
          quality: 'standard' as const,
          response_format: 'b64_json' as const,
        },
      },
      {
        name: 'dall-e-2',
        config: {
          model: 'dall-e-2' as const,
          prompt: prompt,
          n: 1,
          size: '1024x1024' as const,
          response_format: 'b64_json' as const,
        },
      },
    ];

    let lastError: any = null;

    for (const modelInfo of imageModels) {
      try {
        console.log(`Intentando generar imagen con ${modelInfo.name}...`);

        // Emitir evento para indicar que se está generando la imagen
        this.wss.emit('image-generation-start', {
          chatId: chatId,
          message: 'Generando imagen con DALL-E...',
        });
        const response = await this.client.images.generate(modelInfo.config);

        if (response.data && response.data.length > 0) {
          const imageData = response.data[0];
          const imageBase64 = imageData.b64_json;

          if (imageBase64) {
            const imageBuffer = Buffer.from(imageBase64, 'base64');

            // Crear nombre único para la imagen
            const filename = `image_${chatId}_${Date.now()}.png`;
            const imagePath = `uploads/images/${filename}`;

            // Guardar la imagen
            fs.writeFileSync(imagePath, imageBuffer);

            console.log(
              `Imagen generada exitosamente con ${modelInfo.name}: ${imagePath}`,
            );

            // Emitir imagen completada
            this.wss.emit('image-generation-complete', {
              type: 'image',
              chatId: chatId,
              imageUrl: `http://localhost:4000/api/images/${filename}`,
              isPartial: false,
              revisedPrompt: imageData.revised_prompt, // DALL-E a veces revisa el prompt
              modelUsed: modelInfo.name,
            });

            // Guardar el mensaje de imagen en la base de datos
            await this.mensajesService.create({
              contenido: imageData.revised_prompt || prompt, // Usar el prompt revisado si existe
              chatId: chatId,
              emisor: 'LLM',
              tipo: 'IMAGEN',
              rutaImagen: filename,
            });

            return; // Salir del método si fue exitoso
          } else {
            throw new Error('No se recibió data de imagen válida');
          }
        } else {
          throw new Error('No se generó ninguna imagen');
        }
      } catch (error) {
        console.error(`Error con ${modelInfo.name}:`, error);
        lastError = error;

        // Si no es el último modelo, continuar con el siguiente
        if (modelInfo !== imageModels[imageModels.length - 1]) {
          console.log(`Intentando con el siguiente modelo...`);
          continue;
        }
      }
    }

    // Si llegamos aquí, ningún modelo funcionó
    console.error('Todos los modelos de imagen fallaron:', lastError);

    let errorMessage =
      'Error al generar la imagen. Por favor, intenta de nuevo.';

    // Manejar diferentes tipos de errores específicamente
    if (lastError?.status === 403) {
      errorMessage =
        'Tu cuenta de OpenAI no tiene acceso a los modelos de generación de imágenes. Por favor, verifica tu plan.';
    } else if (lastError?.status === 429) {
      errorMessage =
        'Límite de requests alcanzado. Por favor, espera un momento antes de intentar de nuevo.';
    } else if (lastError?.status === 400) {
      errorMessage =
        'El prompt de imagen contiene contenido no permitido. Por favor, intenta con una descripción diferente.';
    } else if (lastError?.message && lastError.message.includes('billing')) {
      errorMessage =
        'No tienes créditos suficientes en tu cuenta de OpenAI. Por favor, verifica tu saldo.';
    }

    this.wss.emit('image-generation-error', {
      chatId: chatId,
      error: errorMessage,
      details: lastError?.message,
    });
  }

  // Endpoint específico para generar imágenes
  @SubscribeMessage('generate-image')
  async handleImagePrompt(
    @MessageBody() data: { chatId: string; prompt: string },
    client: Socket,
  ) {
    console.log('Chat ID:', data.chatId);
    console.log('Prompt de imagen recibido del cliente:', data.prompt);

    // Guardar el mensaje del usuario
    const createdMensaje = await this.mensajesService.create({
      contenido: data.prompt,
      chatId: data.chatId,
      emisor: 'USUARIO',
      tipo: 'TEXTO',
    });

    // Generar imagen
    await this.handleImageGeneration(data.chatId, data.prompt);
  }
}
