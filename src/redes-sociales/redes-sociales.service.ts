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

export interface ContenidoRedesSociales {
  facebook: { caption: string };
  instagram: { caption: string };
  linkedin: { caption: string };
  whatsapp: { titulo: string };
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

    // Guardar resultados en la base de datos
    await this.guardarResultadosPublicacion(
      mensajeId,
      resultados,
      contenido,
      rutaImagen,
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
  ) {
    const mensaje = await this.prisma.mensaje.findUnique({
      where: { id: mensajeId },
      include: { chat: true },
    });

    if (!mensaje) return;

    for (const resultado of resultados) {
      let caption = '';
      switch (resultado.plataforma) {
        case 'facebook':
          caption = contenido.facebook.caption;
          break;
        case 'instagram':
          caption = contenido.instagram.caption;
          break;
        case 'linkedin':
          caption = contenido.linkedin.caption;
          break;
      }

      //GUARDARMOS TODOS LOS DATOS DE LA PUBLICACION EN LA BD
      await this.prisma.publicacion.create({
        data: {
          titulo: `Publicación ${resultado.plataforma}`,
          plataforma: resultado.plataforma,
          postId: resultado.postId,
          caption: caption,
          imagenUrl: rutaImagen
            ? `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/images/${rutaImagen}`
            : undefined,
          link: resultado.link || null,
          mensajeId: mensajeId,
          chatId: mensaje.chatId,
          estado: resultado.exito ? 'PUBLICADO' : 'ERROR',
        },
      });
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
