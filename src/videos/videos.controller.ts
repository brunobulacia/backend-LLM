import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/videos')
export class VideosController {
  @Get(':filename')
  async serveVideo(@Param('filename') filename: string, @Res() res: Response) {
    try {
      console.log('🎬 Sirviendo video:', filename);

      // Construir la ruta completa del archivo
      const videoPath = path.join(process.cwd(), 'uploads', 'videos', filename);
      console.log('📁 Ruta completa:', videoPath);

      // Verificar que el archivo existe
      if (!fs.existsSync(videoPath)) {
        console.log('❌ Video no encontrado');
        throw new NotFoundException('Video no encontrado');
      }

      console.log('✅ Video encontrado, sirviendo...');

      // Configurar headers para video
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');

      // Crear stream de lectura y enviarlo
      const videoStream = fs.createReadStream(videoPath);
      videoStream.pipe(res);

      videoStream.on('error', (error) => {
        console.error('Error streaming video:', error);
        if (!res.headersSent) {
          res.status(500).send('Error al enviar el video');
        }
      });
    } catch (error) {
      console.error('Error sirviendo video:', error);
      if (!res.headersSent) {
        throw new NotFoundException('Video no encontrado');
      }
    }
  }
}
