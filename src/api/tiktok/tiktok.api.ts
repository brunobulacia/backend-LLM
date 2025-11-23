import axios from 'src/lib/axios';
import axiosNativo from 'axios';
import { CrearCredencialesDto } from './dto/crear-credenciales.dto';
import * as fs from 'fs';
import * as path from 'path';

const baseUrl = 'https://api.tiktok.com/v2';

const tiktokToken = process.env.TIKTOK_TOKEN || '';

axios.createInstance(baseUrl);

export const tiktokApi = axios.getInstance(baseUrl);

//1. Crear las credenciales de publicación
export const crearCredencialesPublicacion = async (
  titulo: string,
  videoSize?: number,
) => {
  const data = CrearCredencialesDto(titulo, videoSize);
  const response = await tiktokApi.post('/post/publish/video/init/', data, {
    headers: {
      Authorization: `Bearer ${tiktokToken}`,
    },
  });
  return response.data;
};

//2. Subir el video a TikTok como binario
export const subirVideoTikTok = async (videoFile: File, uploadUrl: string) => {
  const arrayBuffer = await videoFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const videoSize = buffer.length;

  const response = await axiosNativo.put(uploadUrl, buffer, {
    headers: {
      'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
      'Content-Type': 'video/mp4',
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return response.data;
};

//3. Ver el estado de la publicación
export const verEstadoPublicacion = async (publishId: string) => {
  const response = await tiktokApi.get(`/post/publish/video/status/`, {
    headers: {
      Authorization: `Bearer ${tiktokToken}`,
    },
    params: {
      publish_id: publishId,
    },
  });
  return response.data;
};

// SUBIR DE UN SAQUE TODO
export const subirVideoCompletoTikTok = async (
  titulo: string,
  videoFileName: string, // Ahora es el nombre del archivo, no la ruta completa
) => {
  console.log('🎬 [TIKTOK] Iniciando subida completa de video:', {
    titulo,
    videoFileName,
  });

  // Construir la ruta completa del archivo
  const videoPath = path.join(
    process.cwd(),
    'uploads',
    'videos',
    videoFileName,
  );

  // Verificar que el archivo existe
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video no encontrado: ${videoPath}`);
  }

  // Leer el archivo y crear el File object
  const buffer = fs.readFileSync(videoPath);
  const blob = new Blob([buffer]);
  const videoFile = new File([blob], videoFileName, { type: 'video/mp4' });

  console.log('📁 [TIKTOK] Archivo leído correctamente:', {
    size: buffer.length,
    path: videoPath,
  });

  // Paso 1: Crear las credenciales de publicación
  console.log('🔑 [TIKTOK] Creando credenciales de publicación...');
  const credenciales = await crearCredencialesPublicacion(
    titulo,
    buffer.length,
  );
  const uploadUrl = credenciales.upload_url;
  const publishId = credenciales.publish_id;

  console.log('✅ [TIKTOK] Credenciales obtenidas:', { publishId });

  // Paso 2: Subir el video a TikTokn
  console.log('⬆️ [TIKTOK] Subiendo video a TikTok...');
  await subirVideoTikTok(videoFile, uploadUrl);
  console.log('✅ [TIKTOK] Video subido exitosamente');

  // Paso 3: Ver el estado de la publicación
  console.log('⏳ [TIKTOK] Monitoreando estado de publicación...');
  let estadoPublicacion;
  let intentos = 0;
  const maxIntentos = 12; // 1 minuto máximo (12 x 5 segundos)

  do {
    estadoPublicacion = await verEstadoPublicacion(publishId);
    console.log(
      `🔍 [TIKTOK] Estado (intento ${intentos + 1}/${maxIntentos}):`,
      estadoPublicacion.status,
    );

    if (
      estadoPublicacion.status !== 'published' &&
      estadoPublicacion.status !== 'failed'
    ) {
      // Esperar un poco antes de verificar nuevamente
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    intentos++;
  } while (
    estadoPublicacion.status !== 'published' &&
    estadoPublicacion.status !== 'failed' &&
    intentos < maxIntentos
  );

  if (intentos >= maxIntentos) {
    console.log(
      '⚠️ [TIKTOK] Timeout esperando publicación, último estado:',
      estadoPublicacion.status,
    );
  } else {
    console.log(
      '🎉 [TIKTOK] Publicación finalizada con estado:',
      estadoPublicacion.status,
    );
  }

  return estadoPublicacion;
};
