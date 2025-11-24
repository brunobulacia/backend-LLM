import 'dotenv/config';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayDisconnect,
  OnGatewayConnection,
  ConnectedSocket,
} from '@nestjs/websockets';
import { SocketChatService } from './socket-chat.service';
import { Server, Socket } from 'socket.io';
import { MensajesService } from 'src/mensajes/mensajes.service';
//PARA MANEJAR LAS IMAGENES QUE SE VAYAN GENERANDO
import { v4 as uuidv4 } from 'uuid';
import { promises as fs, writeFileSync } from 'fs';

//IMPORT PARA OPENAI
import OpenAI from 'openai';
import { systemPrompt } from './system-prompts/publicaciones.prompt';

// IMPORT PARA REDES SOCIALES
import { PublicationLogger } from '../utils/publication-logger';
import {
  RedesSocialesService,
  ContenidoRedesSociales,
} from '../redes-sociales/redes-sociales.service';
import { VideosService } from '../videos/videos.service';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000/api';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/',
})
export class SocketChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;
  private client: OpenAI;

  constructor(
    private readonly socketChatService: SocketChatService,
    private readonly mensajesService: MensajesService,
    private readonly redesSocialesService: RedesSocialesService,
    private readonly videosService: VideosService,
  ) {
    // Verificar que la API key esté presente
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is required but not found in environment variables',
      );
    }

    // Crear instancia de OpenAI con API KEY
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

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
    @ConnectedSocket() client: Socket,
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
        // console.log(message);
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

    // Detectar si el contenido es JSON de redes sociales
    const isContenidoRedesSociales = this.esContenidoRedesSociales(message);

    let tipoContenido = 'TEXTO';
    let contenidoRedesSociales = null;
    let estadoPublicacion: string | null = null;

    if (isContenidoRedesSociales) {
      tipoContenido = 'CONTENIDO_REDES_SOCIALES';
      try {
        contenidoRedesSociales = JSON.parse(message);
        estadoPublicacion = 'PENDIENTE_CONFIRMACION';

        // Enviar evento especial para contenido de redes sociales
        this.wss.emit('social-content-generated', {
          chatId: chatId,
          contenido: contenidoRedesSociales,
          requiereImagen: true,
        });
      } catch (error) {
        console.error('Error parseando JSON de redes sociales:', error);
        tipoContenido = 'TEXTO';
      }
    }

    // Guardar el mensaje del LLM en la base de datos
    const mensajeGuardado = await this.mensajesService.create({
      contenido: message,
      chatId: chatId,
      emisor: 'LLM',
      tipo: tipoContenido as any,
      contenidoRedesSociales,
      estadoPublicacion: estadoPublicacion as any,
    });

    // Si es contenido de redes sociales, generar imagen y video automáticamente
    if (isContenidoRedesSociales) {
      // Generar imagen para redes sociales (Facebook, Instagram, LinkedIn, WhatsApp)
      await this.generarImagenParaRedesSociales(
        mensajeGuardado.id,
        prompt,
        chatId,
      );

      // Generar video para TikTok
      await this.generarVideoParaTikTok(
        mensajeGuardado.id,
        contenidoRedesSociales,
        chatId,
      );
    }
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
            writeFileSync(imagePath, imageBuffer);

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
    @ConnectedSocket() client: Socket,
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

  // Endpoint para confirmar y publicar contenido en redes sociales
  @SubscribeMessage('confirm-social-publish')
  async handleSocialPublish(
    @MessageBody() data: { mensajeId: string; chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Validar que tenemos los datos necesarios
    if (!data || !data.mensajeId || !data.chatId) {
      const error = 'Datos de mensaje inválidos';
      PublicationLogger.logError('unknown', 'WEBSOCKET', error, { data });
      throw new Error(error);
    }

    PublicationLogger.logInfo(
      data.mensajeId,
      'WEBSOCKET',
      'Recibida confirmación de publicación',
      {
        chatId: data.chatId,
        clientId: client?.id || 'unknown',
        clientConnected: !!client,
      },
    );

    try {
      PublicationLogger.logInfo(
        data.mensajeId,
        'WEBSOCKET',
        'Obteniendo mensaje de la base de datos',
      );

      // Obtener el mensaje con el contenido de redes sociales
      const mensaje = await this.mensajesService.findOne(data.mensajeId);

      if (
        !mensaje ||
        !mensaje.contenidoRedesSociales ||
        mensaje.tipo !== 'CONTENIDO_REDES_SOCIALES'
      ) {
        PublicationLogger.logError(
          data.mensajeId,
          'WEBSOCKET',
          'Mensaje no válido para publicación',
          {
            tieneContenido: !!mensaje?.contenidoRedesSociales,
            tipo: mensaje?.tipo,
          },
        );
        throw new Error('Mensaje no válido para publicación en redes sociales');
      }

      PublicationLogger.logSuccess(
        data.mensajeId,
        'WEBSOCKET',
        'Mensaje válido encontrado',
        {
          tipo: mensaje.tipo,
          tieneImagen: !!mensaje.imagenGenerada,
        },
      );

      // Actualizar estado a CONFIRMADO
      PublicationLogger.logInfo(
        data.mensajeId,
        'WEBSOCKET',
        'Actualizando estado a CONFIRMADO',
      );
      await this.mensajesService.update(data.mensajeId, {
        estadoPublicacion: 'CONFIRMADO',
      });

      // Notificar inicio de publicación
      PublicationLogger.logInfo(
        data.mensajeId,
        'WEBSOCKET',
        'Enviando notificación de inicio al cliente',
      );
      this.wss.emit('social-publish-start', {
        chatId: data.chatId,
        mensajeId: data.mensajeId,
      });

      // Publicar en todas las redes sociales
      PublicationLogger.logInfo(
        data.mensajeId,
        'WEBSOCKET',
        'Iniciando proceso de publicación en redes sociales',
      );
      const resultados =
        await this.redesSocialesService.publicarEnTodasLasRedes(
          data.mensajeId,
          mensaje.contenidoRedesSociales as unknown as ContenidoRedesSociales,
          mensaje.imagenGenerada || undefined,
          mensaje.videoGenerado || undefined,
        );

      // Enviar resultados al cliente
      PublicationLogger.logSuccess(
        data.mensajeId,
        'WEBSOCKET',
        'Publicación completada, enviando resultados al cliente',
        {
          totalResultados: resultados.length,
          exitosos: resultados.filter((r) => r.exito).length,
          fallidos: resultados.filter((r) => !r.exito).length,
        },
      );

      this.wss.emit('social-publish-complete', {
        chatId: data.chatId,
        mensajeId: data.mensajeId,
        resultados: resultados,
      });
    } catch (error) {
      PublicationLogger.logError(
        data.mensajeId,
        'WEBSOCKET',
        'Error general en el proceso de publicación',
        error,
      );

      // Actualizar estado a ERROR
      await this.mensajesService.update(data.mensajeId, {
        estadoPublicacion: 'ERROR',
      });

      PublicationLogger.logError(
        data.mensajeId,
        'WEBSOCKET',
        'Enviando notificación de error al cliente',
      );

      this.wss.emit('social-publish-error', {
        chatId: data.chatId,
        mensajeId: data.mensajeId,
        error: error.message,
      });
    }
  }

  /**
   * Detecta si un mensaje contiene JSON válido para redes sociales
   */
  private esContenidoRedesSociales(mensaje: string): boolean {
    try {
      const json = JSON.parse(mensaje);

      // Verificar que tenga la estructura esperada
      return (
        json.facebook &&
        typeof json.facebook.caption === 'string' &&
        json.instagram &&
        typeof json.instagram.caption === 'string' &&
        json.linkedin &&
        typeof json.linkedin.caption === 'string' &&
        json.whatsapp &&
        typeof json.whatsapp.caption === 'string' &&
        json.tiktok &&
        typeof json.tiktok.titulo === 'string' &&
        Array.isArray(json.tiktok.hashtags)
      );
    } catch {
      return false;
    }
  }

  /**
   * Genera una imagen específica para acompañar el contenido de redes sociales
   */
  private async generarImagenParaRedesSociales(
    mensajeId: string,
    promptOriginal: string,
    chatId: string,
  ) {
    console.log('Generando imagen para redes sociales...');

    // Crear prompt optimizado para redes sociales de la FICCT
    const promptImagen = `Crea una imagen profesional y atractiva para redes sociales de la Facultad de Ingeniería de Ciencias de la Computación y Telecomunicaciones (FICCT) relacionada con: ${promptOriginal}. La imagen debe ser visualmente moderna, tecnológica y apropiada para publicar en Facebook, Instagram y LinkedIn. Colores institucionales y elementos relacionados con tecnología, computación y telecomunicaciones.`;

    this.wss.emit('social-image-generation-start', {
      chatId: chatId,
      mensajeId: mensajeId,
      message: 'Generando imagen para redes sociales...',
    });

    const imageModels = [
      {
        name: 'dall-e-3',
        config: {
          model: 'dall-e-3' as const,
          prompt: promptImagen,
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
          prompt: promptImagen,
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

        const response = await this.client.images.generate(modelInfo.config);

        if (response.data && response.data.length > 0) {
          const imageData = response.data[0];
          if (imageData.b64_json) {
            // Procesar y guardar imagen
            const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
            const filename = `social_${mensajeId}_${Date.now()}.png`;
            const imagePath = `uploads/images/${filename}`;

            // Asegurar que el directorio existe
            await fs.mkdir('uploads/images', { recursive: true });
            writeFileSync(imagePath, imageBuffer);

            console.log(` Imagen para redes sociales guardada: ${filename}`);

            // Actualizar el mensaje con la ruta de la imagen
            console.log(
              ` Actualizando mensaje ${mensajeId} con imagen: ${filename}`,
            );
            const mensajeActualizado = await this.mensajesService.update(
              mensajeId,
              {
                rutaImagen: filename, // Para persistencia y compatibilidad
                imagenGenerada: filename, // Para el sistema de redes sociales
              },
            );
            console.log(` Mensaje actualizado:`, {
              id: mensajeActualizado.id,
              rutaImagen: mensajeActualizado.rutaImagen,
              imagenGenerada: mensajeActualizado.imagenGenerada,
              tipo: mensajeActualizado.tipo,
            });

            // Notificar que la imagen está lista - usar localhost para el frontend
            this.wss.emit('social-image-generation-complete', {
              chatId: chatId,
              mensajeId: mensajeId,
              imageUrl: `${process.env.BACKEND_URL}/api/images/${filename}`,
              modelUsed: modelInfo.name,
              revisedPrompt: imageData.revised_prompt,
            });

            return; // Éxito, salir del método
          }
        }
        throw new Error('No se recibió data de imagen válida');
      } catch (error) {
        console.error(`Error generando imagen con ${modelInfo.name}:`, error);
        lastError = error;
        continue; // Intentar con el siguiente modelo
      }
    }

    // Si llegamos aquí, ningún modelo funcionó
    console.error('Error generando imagen para redes sociales:', lastError);
    this.wss.emit('social-image-generation-error', {
      chatId: chatId,
      mensajeId: mensajeId,
      error: 'Error al generar la imagen para redes sociales',
    });
  }

  /**
   * Genera un video con Sora para TikTok basado en el contenido de redes sociales
   */
  private async generarVideoParaTikTok(
    mensajeId: string,
    contenidoRedesSociales: ContenidoRedesSociales,
    chatId: string,
  ) {
    console.log('🎬 Generando video para TikTok...');

    // Emitir evento de inicio de generación de video
    this.wss.emit('social-video-generation-start', {
      chatId: chatId,
      mensajeId: mensajeId,
      message: 'Generando video para TikTok con Sora...',
    });

    try {
      // Generar prompt optimizado para TikTok
      const promptVideo = this.videosService.generarPromptParaTikTok(
        contenidoRedesSociales.tiktok,
      );

      // Generar video con Sora
      const rutaVideo = await this.videosService.generarVideoConSora(
        promptVideo,
        mensajeId,
      );

      if (rutaVideo) {
        console.log('✅ Video generado exitosamente:', rutaVideo);

        // Emitir evento de éxito
        this.wss.emit('social-video-generated', {
          chatId: chatId,
          mensajeId: mensajeId,
          message: 'Video para TikTok generado exitosamente',
          videoPath: rutaVideo,
        });
      } else {
        throw new Error('No se pudo generar el video');
      }
    } catch (error) {
      console.error('❌ Error generando video para TikTok:', error);

      this.wss.emit('social-video-generation-error', {
        chatId: chatId,
        mensajeId: mensajeId,
        error: 'Error al generar el video para TikTok',
      });
    }
  }

  /**
   * Generar video con IA (Runway ML) y publicar SOLO en TikTok
   */
  @SubscribeMessage('generate-ai-video-tiktok')
  async handleGenerateAIVideoTikTok(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      chatId: string;
      mensajeId: string;
      contenido: ContenidoRedesSociales;
      promptVideo: string;
    },
  ): Promise<void> {
    try {
      console.log(
        '🤖 Iniciando generación de video IA para TikTok:',
        data.chatId,
      );

      // Emitir estado inicial
      client.to(data.chatId).emit('ai-video-status', {
        mensajeId: data.mensajeId,
        status: 'generating',
        message: 'Generando video con inteligencia artificial (Runway ML)...',
        estimatedTime: '2-5 minutos',
        progress: 0,
      });

      // Generar y publicar
      const resultados =
        await this.redesSocialesService.generarYPublicarVideoIA(
          data.mensajeId,
          data.contenido,
          data.promptVideo,
        );

      // Emitir resultado exitoso
      client.to(data.chatId).emit('ai-video-complete', {
        mensajeId: data.mensajeId,
        resultados,
        success: true,
        message: 'Video generado con IA y publicado en TikTok exitosamente',
        plataformas: resultados.map((r) => r.plataforma),
      });

      console.log('✅ Video IA generado y publicado exitosamente');
    } catch (error) {
      console.error('❌ Error generando video IA:', error);

      client.to(data.chatId).emit('ai-video-error', {
        mensajeId: data.mensajeId,
        error: error.message,
        success: false,
        message: 'Error generando video con IA',
      });
    }
  }
}
