import axios from 'src/lib/axios';
import axiosNativo from 'axios';
import { CrearCredencialesDto } from './dto/crear-credenciales.dto';

const baseUrl = 'https://api.tiktok.com/v2';

const tiktokToken = process.env.TIKTOK_TOKEN || '';

axios.createInstance(baseUrl);

export const tiktokApi = axios.getInstance(baseUrl);

//1. Crear las credenciales de publicación
export const crearCredencialesPublicacion = async (titulo: string) => {
  const data = CrearCredencialesDto(titulo);
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
  videoFile: File,
) => {
  // Paso 1: Crear las credenciales de publicación
  const credenciales = await crearCredencialesPublicacion(titulo);
  const uploadUrl = credenciales.upload_url;
  const publishId = credenciales.publish_id;

  // Paso 2: Subir el video a TikTok
  await subirVideoTikTok(videoFile, uploadUrl);

  // Paso 3: Ver el estado de la publicación
  let estadoPublicacion;
  do {
    estadoPublicacion = await verEstadoPublicacion(publishId);
    // Esperar un poco antes de verificar nuevamente
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } while (
    estadoPublicacion.status !== 'published' &&
    estadoPublicacion.status !== 'failed'
  );

  return estadoPublicacion;
};
