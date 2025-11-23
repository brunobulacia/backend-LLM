import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideosService {
  private openai: OpenAI;

  constructor(private readonly prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Genera un video con Sora y lo descarga localmente
   * Si Sora no está disponible, usa un video de ejemplo
   */
  async generarVideoConSora(
    prompt: string,
    mensajeId: string,
  ): Promise<string | null> {
    try {
      console.log(
        '🎬 [SORA] Iniciando generación de video con prompt:',
        prompt.substring(0, 100) + '...',
      );

      // Actualizar estado del mensaje a GENERANDO
      await this.prisma.mensaje.update({
        where: { id: mensajeId },
        data: { estadoVideo: 'GENERANDO' },
      });

      // Intentar crear el video con Sora
      let video;
      try {
        video = await this.openai.videos.create({
          model: 'sora-2',
          prompt: prompt,
        });
      } catch (soraError: any) {
        // Si hay error de permisos con Sora, usar video de ejemplo
        if (
          soraError.status === 403 ||
          soraError.type === 'invalid_request_error'
        ) {
          console.log('⚠️ [SORA] No disponible, usando video de ejemplo...');
          return await this.usarVideoDeEjemplo(mensajeId);
        }
        throw soraError; // Re-lanzar otros errores
      }

      console.log('🎬 [SORA] Video generation started:', video);

      // Guardar el ID del video en la base de datos
      await this.prisma.mensaje.update({
        where: { id: mensajeId },
        data: { soraVideoId: video.id },
      });

      let progress = video.progress ?? 0;

      // Polling del estado del video
      while (video.status === 'in_progress' || video.status === 'queued') {
        video = await this.openai.videos.retrieve(video.id);
        progress = video.progress ?? 0;

        const statusText = video.status === 'queued' ? 'Queued' : 'Processing';
        console.log(`🎬 [SORA] ${statusText}: ${progress.toFixed(1)}%`);

        // Esperar 2 segundos antes de verificar nuevamente
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (video.status === 'failed') {
        console.error('❌ [SORA] Video generation failed');

        await this.prisma.mensaje.update({
          where: { id: mensajeId },
          data: { estadoVideo: 'ERROR' },
        });

        return null;
      }

      console.log('✅ [SORA] Video generation completed:', video);

      // Descargar el contenido del video
      console.log('📥 [SORA] Downloading video content...');
      const content = await this.openai.videos.downloadContent(video.id);
      const body = content.arrayBuffer();
      const buffer = Buffer.from(await body);

      // Crear el nombre del archivo
      const fileName = `sora_${mensajeId}_${Date.now()}.mp4`;
      const videoPath = path.join(process.cwd(), 'uploads', 'videos', fileName);

      // Asegurar que el directorio existe
      const videoDir = path.dirname(videoPath);
      if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, { recursive: true });
      }

      // Guardar el archivo
      fs.writeFileSync(videoPath, buffer);
      console.log('💾 [SORA] Video saved to:', videoPath);

      // Actualizar el mensaje con la ruta del video
      await this.prisma.mensaje.update({
        where: { id: mensajeId },
        data: {
          videoGenerado: fileName,
          estadoVideo: 'COMPLETADO',
        },
      });

      return fileName;
    } catch (error) {
      console.error('❌ [SORA] Error generating video:', error);

      await this.prisma.mensaje.update({
        where: { id: mensajeId },
        data: { estadoVideo: 'ERROR' },
      });

      return null;
    }
  }

  /**
   * Genera un prompt optimizado para TikTok basado en el contenido de redes sociales
   */
  generarPromptParaTikTok(contenidoTikTok: {
    titulo: string;
    hashtags: string[];
  }): string {
    const { titulo } = contenidoTikTok;

    // Crear un prompt optimizado para TikTok
    const promptBase = `Create a dynamic and engaging vertical video (9:16 aspect ratio) for TikTok about: ${titulo}. 
    The video should be vibrant, eye-catching, with modern graphics, smooth transitions, and text overlays. 
    Style: Professional yet trendy, suitable for educational content about technology and computer science. 
    Duration: 8 seconds maximum. Include visual elements that represent innovation, technology, and education.`;

    return promptBase;
  }

  /**
   * Usa el video de ejemplo cuando Sora no está disponible
   */
  private async usarVideoDeEjemplo(mensajeId: string): Promise<string | null> {
    try {
      console.log('📹 [VIDEO] Usando video de ejemplo...');

      // Ruta del video de ejemplo
      const videoEjemploPath = path.join(
        process.cwd(),
        'uploads',
        'videos',
        'sample_640x360.mp4',
      );

      // Verificar que el video de ejemplo existe
      if (!fs.existsSync(videoEjemploPath)) {
        console.error(
          '❌ [VIDEO] Video de ejemplo no encontrado:',
          videoEjemploPath,
        );

        await this.prisma.mensaje.update({
          where: { id: mensajeId },
          data: { estadoVideo: 'ERROR' },
        });

        return null;
      }

      // Crear una copia del video de ejemplo con nombre único para este mensaje
      const fileName = `sample_${mensajeId}_${Date.now()}.mp4`;
      const nuevoVideoPath = path.join(
        process.cwd(),
        'uploads',
        'videos',
        fileName,
      );

      // Copiar el archivo
      fs.copyFileSync(videoEjemploPath, nuevoVideoPath);
      console.log('✅ [VIDEO] Video de ejemplo copiado:', fileName);

      // Actualizar el mensaje con la ruta del video
      await this.prisma.mensaje.update({
        where: { id: mensajeId },
        data: {
          videoGenerado: fileName,
          estadoVideo: 'COMPLETADO',
        },
      });

      return fileName;
    } catch (error) {
      console.error('❌ [VIDEO] Error usando video de ejemplo:', error);

      await this.prisma.mensaje.update({
        where: { id: mensajeId },
        data: { estadoVideo: 'ERROR' },
      });

      return null;
    }
  }

  /**
   * Verifica el estado de un video en Sora
   */
  async verificarEstadoVideo(videoId: string) {
    try {
      const video = await this.openai.videos.retrieve(videoId);
      return video;
    } catch (error) {
      console.error('Error verificando estado del video:', error);
      return null;
    }
  }
}
