import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  sendFacebookMessage,
  sendFacebookImage,
} from '../api/facebook/facebook.api';
import { postImageToInstagram } from '../api/instagram/instagram.api';
import {
  publishContent,
  publicarImagenEnLinkedIn,
} from '../api/linkedIn/linkedIn.api';
import { PublicationLogger } from '../utils/publication-logger';
import * as fs from 'fs';
import * as path from 'path';
import { contactos } from 'src/utils/contacts';
import { sendStory } from 'src/api/whatsapp/whatsapp.api';
import { subirVideoCompletoTikTok } from 'src/api/tiktok/tiktok.api';
import { generarVideoParaTikTok } from 'src/api/runway/runway.api';

export interface ContenidoRedesSociales {
  facebook: { caption: string };
  instagram: { caption: string };
  linkedin: { caption: string };
  whatsapp: { caption: string };
  tiktok: { titulo: string; hashtags: string[] };
}

export interface ResultadoPublicacion {
  plataforma: string;
  exito: boolean;
  postId?: string;
  error?: string;
  link?: string;
}

@Injectable()
export class RedesSocialesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Publica contenido en todas las redes sociales disponibles
   */
  async publicarEnTodasLasRedes(
    mensajeId: string,
    contenido: ContenidoRedesSociales,
    rutaImagen?: string,
    rutaVideo?: string,
  ): Promise<ResultadoPublicacion[]> {
    const resultados: ResultadoPublicacion[] = [];

    // Log inicio del proceso
    PublicationLogger.logStart(mensajeId, contenido, rutaImagen);

    // Actualizar estado del mensaje a PUBLICANDO
    PublicationLogger.logInfo(
      mensajeId,
      'DATABASE',
      'Actualizando estado a PUBLICANDO',
    );
    await this.prisma.mensaje.update({
      where: { id: mensajeId },
      data: { estadoPublicacion: 'PUBLICANDO' },
    });
    PublicationLogger.logSuccess(
      mensajeId,
      'DATABASE',
      'Estado actualizado correctamente',
    );

    // Preparar imagen si existe
    let imagenFile: File | undefined;
    let imagenUrl: string | undefined;

    if (rutaImagen) {
      const fullPath = path.join(
        process.cwd(),
        'uploads',
        'images',
        rutaImagen,
      );
      PublicationLogger.logInfo(mensajeId, 'IMAGE', 'Verificando imagen', {
        rutaImagen,
        fullPath,
      });

      if (fs.existsSync(fullPath)) {
        PublicationLogger.logSuccess(
          mensajeId,
          'IMAGE',
          'Imagen encontrada correctamente',
        );

        // Para LinkedIn necesitamos un File object
        const buffer = fs.readFileSync(fullPath);
        const blob = new Blob([buffer]);
        imagenFile = new File([blob], path.basename(rutaImagen), {
          type: 'image/png',
        });

        // URL para Facebook e Instagram usando la imagen generada localmente
        imagenUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/images/${rutaImagen}`;
        PublicationLogger.logInfo(
          mensajeId,
          'IMAGE',
          'URL generada para redes sociales',
          { imagenUrl },
        );
      } else {
        PublicationLogger.logError(mensajeId, 'IMAGE', 'Imagen no encontrada', {
          fullPath,
        });
      }
    }

    // Publicar en Facebook
    try {
      PublicationLogger.logInfo(
        mensajeId,
        'FACEBOOK',
        'Iniciando publicación en Facebook',
        {
          tieneImagen: !!imagenUrl,
          caption: contenido.facebook.caption.substring(0, 100) + '...',
        },
      );

      let facebookResult;
      if (imagenUrl) {
        facebookResult = await sendFacebookImage({
          imageUrl: imagenUrl,
          caption: contenido.facebook.caption,
        });
      } else {
        facebookResult = await sendFacebookMessage({
          message: contenido.facebook.caption,
        });
      }

      const resultado = {
        plataforma: 'facebook',
        exito: true,
        postId: facebookResult?.id || 'unknown',
        link: facebookResult?.id
          ? `https://facebook.com/${facebookResult.id}`
          : 'No disponible',
      };

      PublicationLogger.logSuccess(
        mensajeId,
        'FACEBOOK',
        'Publicación exitosa',
        {
          postId: resultado.postId,
          link: resultado.link,
        },
      );

      resultados.push(resultado);
    } catch (error) {
      PublicationLogger.logError(
        mensajeId,
        'FACEBOOK',
        'Error en publicación',
        error,
      );
      console.error('Error publicando en Facebook:', error);
      resultados.push({
        plataforma: 'facebook',
        exito: false,
        error: error.message,
      });
    }

    // Publicar en Instagram
    try {
      if (imagenUrl) {
        PublicationLogger.logInfo(
          mensajeId,
          'INSTAGRAM',
          'Iniciando publicación en Instagram',
          {
            imageUrl: imagenUrl,
            caption: contenido.instagram.caption.substring(0, 100) + '...',
          },
        );

        // Usar la nueva función que combina crear contenedor y publicar
        const publicacion = await postImageToInstagram({
          image_url: imagenUrl,
          caption: contenido.instagram.caption,
        });

        PublicationLogger.logSuccess(
          mensajeId,
          'INSTAGRAM',
          'Publicación completada exitosamente',
          {
            postId: publicacion?.id,
            response: publicacion,
          },
        );

        const resultado = {
          plataforma: 'instagram',
          exito: true,
          postId: publicacion?.id || 'unknown',
          link: publicacion?.id
            ? `https://instagram.com/p/${publicacion.id}`
            : 'No disponible',
        };

        resultados.push(resultado);
      } else {
        PublicationLogger.logWarning(
          mensajeId,
          'INSTAGRAM',
          'No se puede publicar sin imagen',
        );

        resultados.push({
          plataforma: 'instagram',
          exito: false,
          error: 'Instagram requiere imagen',
        });
      }
    } catch (error) {
      PublicationLogger.logError(
        mensajeId,
        'INSTAGRAM',
        'Error en publicación',
        error,
      );

      resultados.push({
        plataforma: 'instagram',
        exito: false,
        error: error.message,
      });
    }

    // Publicar en LinkedIn
    try {
      PublicationLogger.logInfo(
        mensajeId,
        'LINKEDIN',
        'Iniciando publicación en LinkedIn',
        {
          tieneImagen: !!imagenFile,
          caption: contenido.linkedin.caption.substring(0, 100) + '...',
        },
      );

      let linkedinResult;
      if (imagenFile) {
        linkedinResult = await publicarImagenEnLinkedIn(
          contenido.linkedin.caption,
          imagenFile,
        );
      } else {
        // Publicar solo texto
        const publishDto: any = {
          author: `urn:li:person:${process.env.LINKEDIN_URN_PERSON}` || '',
          lifecycleState: 'PUBLISHED' as const,
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: contenido.linkedin.caption,
              },
              shareMediaCategory: 'NONE' as const,
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' as const,
          },
        };
        linkedinResult = await publishContent(publishDto);
      }

      const resultado = {
        plataforma: 'linkedin',
        exito: true,
        postId: linkedinResult?.id || 'unknown',
        link: linkedinResult?.id
          ? `https://linkedin.com/feed/update/${linkedinResult.id}`
          : 'No disponible',
      };

      PublicationLogger.logSuccess(
        mensajeId,
        'LINKEDIN',
        'Publicación exitosa',
        {
          postId: resultado.postId,
          link: resultado.link,
          response: linkedinResult,
        },
      );

      resultados.push(resultado);
    } catch (error) {
      PublicationLogger.logError(
        mensajeId,
        'LINKEDIN',
        'Error en publicación',
        error,
      );

      resultados.push({
        plataforma: 'linkedin',
        exito: false,
        error: error.message,
      });
    }

    //Publicar story en whatsapp
    try {
      // Debug: Log del contenido completo
      PublicationLogger.logInfo(
        mensajeId,
        'WHATSAPP',
        'Debug - contenido completo para WhatsApp',
        {
          contenidoCompleto: contenido,
          whatsappExists: !!contenido.whatsapp,
          whatsappCaption: contenido.whatsapp?.caption,
        },
      );

      PublicationLogger.logInfo(
        mensajeId,
        'WHATSAPP',
        'Iniciando publicación en WhatsApp',
        {
          tieneImagen: !!imagenUrl,
          caption:
            (contenido.whatsapp?.caption || 'Sin caption').substring(0, 100) +
            '...',
        },
      );

      // Para WhatsApp, usar directamente el nombre del archivo de rutaImagen
      const whatsappResult = await sendStory({
        media: rutaImagen ? `dummy:///${rutaImagen}` : null, // Usar un formato que permita extraer el nombre del archivo
        caption: contenido.whatsapp?.caption || 'Contenido para WhatsApp Story',
        exclude_contacts: contactos,
      });

      const resultado = {
        plataforma: 'whatsapp',
        exito: true,
        postId: whatsappResult?.id || 'story',
        link: 'WhatsApp Story publicado',
      };

      PublicationLogger.logSuccess(
        mensajeId,
        'WHATSAPP',
        'Story publicado exitosamente',
        {
          postId: resultado.postId,
          response: whatsappResult,
        },
      );

      resultados.push(resultado);
    } catch (error) {
      PublicationLogger.logError(
        mensajeId,
        'WHATSAPP',
        'Error en publicación',
        error,
      );

      resultados.push({
        plataforma: 'whatsapp',
        exito: false,
        error: error.message,
      });
    }

    //Publicar en TikTok
    try {
      if (rutaVideo) {
        PublicationLogger.logInfo(
          mensajeId,
          'TIKTOK',
          'Iniciando publicación en TikTok',
          {
            tieneVideo: !!rutaVideo,
            titulo: contenido.tiktok.titulo.substring(0, 50) + '...',
            hashtags: contenido.tiktok.hashtags.join(', '),
          },
        );

        const tiktokResult = await subirVideoCompletoTikTok(
          contenido.tiktok.titulo,
          rutaVideo,
        );

        const resultado = {
          plataforma: 'tiktok',
          exito: tiktokResult.status === 'published',
          postId: tiktokResult.publish_id || 'unknown',
          link:
            tiktokResult.status === 'published'
              ? `https://www.tiktok.com/@novedades_ficct/video/${tiktokResult.publish_id}`
              : 'No disponible',
        };

        if (tiktokResult.status === 'published') {
          PublicationLogger.logSuccess(
            mensajeId,
            'TIKTOK',
            'Video publicado exitosamente',
            {
              publishId: resultado.postId,
              status: tiktokResult.status,
            },
          );
        } else {
          PublicationLogger.logError(
            mensajeId,
            'TIKTOK',
            'Video no se publicó correctamente',
            { status: tiktokResult.status, result: tiktokResult },
          );
          resultado.exito = false;
          (resultado as any).error = `Estado: ${tiktokResult.status}`;
        }

        resultados.push(resultado);
      } else {
        PublicationLogger.logWarning(
          mensajeId,
          'TIKTOK',
          'No se puede publicar sin video',
        );

        resultados.push({
          plataforma: 'tiktok',
          exito: false,
          error: 'TikTok requiere video',
        });
      }
    } catch (error) {
      PublicationLogger.logError(
        mensajeId,
        'TIKTOK',
        'Error en publicación',
        error,
      );

      resultados.push({
        plataforma: 'tiktok',
        exito: false,
        error: error.message,
      });
    }

    // Guardar resultados en la base de datos
    await this.guardarResultadosPublicacion(
      mensajeId,
      resultados,
      contenido,
      rutaImagen,
      rutaVideo,
    );

    // Actualizar estado final del mensaje
    const todoExitoso = resultados.every((r) => r.exito);
    const estadoFinal = todoExitoso ? 'PUBLICADO' : 'ERROR';

    PublicationLogger.logInfo(
      mensajeId,
      'DATABASE',
      'Actualizando estado final',
      {
        estadoFinal,
        todoExitoso,
      },
    );

    await this.prisma.mensaje.update({
      where: { id: mensajeId },
      data: {
        estadoPublicacion: estadoFinal,
      },
    });

    PublicationLogger.logSuccess(
      mensajeId,
      'DATABASE',
      'Estado final actualizado correctamente',
    );

    // Log final del proceso
    PublicationLogger.logEnd(mensajeId, resultados);

    return resultados;
  }

  private async guardarResultadosPublicacion(
    mensajeId: string,
    resultados: ResultadoPublicacion[],
    contenido: ContenidoRedesSociales,
    rutaImagen?: string,
    rutaVideo?: string,
  ) {
    const mensaje = await this.prisma.mensaje.findUnique({
      where: { id: mensajeId },
      include: { chat: true },
    });

    if (!mensaje) return;

    for (const resultado of resultados) {
      let caption = '';

      try {
        switch (resultado.plataforma) {
          case 'facebook':
            caption = contenido.facebook?.caption || 'Contenido para Facebook';
            break;
          case 'instagram':
            caption =
              contenido.instagram?.caption || 'Contenido para Instagram';
            break;
          case 'linkedin':
            caption = contenido.linkedin?.caption || 'Contenido para LinkedIn';
            break;
          case 'whatsapp':
            caption = contenido.whatsapp?.caption || 'Contenido para WhatsApp';
            break;
          case 'tiktok':
            caption = contenido.tiktok?.titulo || 'Contenido para TikTok';
            break;
          default:
            caption = `Contenido para ${resultado.plataforma}`;
            break;
        }
      } catch (error) {
        PublicationLogger.logError(
          mensajeId,
          'DATABASE',
          `Error obteniendo caption para ${resultado.plataforma}`,
          { error, contenido },
        );
        caption = `Contenido para ${resultado.plataforma}`;
      }

      PublicationLogger.logInfo(
        mensajeId,
        'DATABASE',
        `Guardando publicación de ${resultado.plataforma}`,
        {
          plataforma: resultado.plataforma,
          caption: caption.substring(0, 50) + '...',
          postId: resultado.postId,
          exito: resultado.exito,
        },
      );

      // Validar que caption no esté vacío
      if (!caption || caption.trim() === '') {
        caption = `Contenido para ${resultado.plataforma}`;
        PublicationLogger.logWarning(
          mensajeId,
          'DATABASE',
          `Caption vacío para ${resultado.plataforma}, usando default`,
        );
      }

      //GUARDARMOS TODOS LOS DATOS DE LA PUBLICACION EN LA BD
      try {
        await this.prisma.publicacion.create({
          data: {
            titulo: `Publicación ${resultado.plataforma}`,
            plataforma: resultado.plataforma,
            postId: resultado.postId || null,
            caption: caption,
            imagenUrl: rutaImagen
              ? `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/images/${rutaImagen}`
              : undefined,
            videoUrl:
              rutaVideo && resultado.plataforma === 'tiktok'
                ? `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/videos/${rutaVideo}`
                : undefined,
            link: resultado.link || null,
            mensajeId: mensajeId,
            chatId: mensaje.chatId,
            estado: resultado.exito ? 'PUBLICADO' : 'ERROR',
          },
        });

        PublicationLogger.logSuccess(
          mensajeId,
          'DATABASE',
          `Publicación de ${resultado.plataforma} guardada correctamente`,
        );
      } catch (dbError) {
        PublicationLogger.logError(
          mensajeId,
          'DATABASE',
          `Error guardando publicación de ${resultado.plataforma}`,
          { dbError, resultado, caption },
        );
      }
    }
  }

  /**
   * Generar video con IA usando Runway ML y publicar SOLO en TikTok
   */
  async generarYPublicarVideoIA(
    mensajeId: string,
    contenido: ContenidoRedesSociales,
    promptVideo: string,
  ): Promise<ResultadoPublicacion[]> {
    const resultados: ResultadoPublicacion[] = [];

    // Log inicio del proceso
    PublicationLogger.logStart(
      mensajeId,
      { ai_video: { prompt: promptVideo } },
      undefined,
    );

    try {
      // Actualizar estado del mensaje a GENERANDO_VIDEO
      PublicationLogger.logInfo(
        mensajeId,
        'DATABASE',
        'Actualizando estado a GENERANDO_VIDEO',
      );
      await this.prisma.mensaje.update({
        where: { id: mensajeId },
        data: { estadoPublicacion: 'PUBLICANDO' }, // Usar PUBLICANDO por ahora
      });

      // 1. Generar video con Runway ML (2 segundos, formato TikTok)
      PublicationLogger.logInfo(
        mensajeId,
        'RUNWAY',
        'Iniciando generación de video IA',
        { prompt: promptVideo, duration: 2, ratio: '720:1280' },
      );

      const videoFileName = await generarVideoParaTikTok(promptVideo);

      PublicationLogger.logSuccess(
        mensajeId,
        'RUNWAY',
        'Video IA generado exitosamente',
        { videoFileName },
      );

      // 2. Publicar SOLO en TikTok
      try {
        PublicationLogger.logInfo(
          mensajeId,
          'TIKTOK',
          'Iniciando publicación en TikTok con video IA',
          {
            videoFileName,
            titulo: contenido.tiktok.titulo,
          },
        );

        const tiktokResult = await subirVideoCompletoTikTok(
          contenido.tiktok.titulo,
          videoFileName,
        );

        const resultado = {
          plataforma: 'tiktok',
          exito: true,
          postId: tiktokResult?.id || 'ai_video',
          link: tiktokResult?.share_url || 'TikTok video publicado con IA',
        };

        PublicationLogger.logSuccess(
          mensajeId,
          'TIKTOK',
          'Video IA publicado exitosamente',
          {
            postId: resultado.postId,
            link: resultado.link,
            response: tiktokResult,
          },
        );

        resultados.push(resultado);
      } catch (error) {
        PublicationLogger.logError(
          mensajeId,
          'TIKTOK',
          'Error publicando video IA',
          error,
        );

        resultados.push({
          plataforma: 'tiktok',
          exito: false,
          error: error.message,
        });
      }

      // 3. Guardar resultados en la base de datos
      await this.guardarResultadosPublicacion(
        mensajeId,
        resultados,
        contenido,
        undefined, // Sin imagen
        videoFileName, // Con video IA
      );

      // 4. Actualizar estado final del mensaje
      const todoExitoso = resultados.every((r) => r.exito);
      const estadoFinal = todoExitoso ? 'PUBLICADO' : 'ERROR';

      PublicationLogger.logInfo(
        mensajeId,
        'DATABASE',
        'Actualizando estado final',
        {
          estadoFinal,
          todoExitoso,
        },
      );

      await this.prisma.mensaje.update({
        where: { id: mensajeId },
        data: {
          estadoPublicacion: estadoFinal,
          videoGenerado: videoFileName,
        },
      });

      PublicationLogger.logSuccess(
        mensajeId,
        'DATABASE',
        'Estado final actualizado correctamente',
      );

      // Log final del proceso
      PublicationLogger.logEnd(mensajeId, resultados);

      return resultados;
    } catch (error) {
      PublicationLogger.logError(
        mensajeId,
        'AI_VIDEO',
        'Error en proceso completo de video IA',
        error,
      );

      // Actualizar estado de error
      await this.prisma.mensaje.update({
        where: { id: mensajeId },
        data: { estadoPublicacion: 'ERROR' },
      });

      throw new Error(`Error generando video con IA: ${error.message}`);
    }
  }

  /**
   * Obtiene el historial de publicaciones de un chat
   */
  async obtenerHistorialPublicaciones(chatId: string) {
    return await this.prisma.publicacion.findMany({
      where: {
        chatId: chatId,
        isActive: true,
      },
      include: {
        mensaje: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
