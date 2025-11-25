import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const runwayToken = process.env.RUNWAY_API_KEY || '';
const runwayBaseUrl = 'https://api.dev.runwayml.com';

// Cliente HTTP para Runway
const runwayApi = axios.create({
  baseURL: runwayBaseUrl,
  headers: {
    Authorization: `Bearer ${runwayToken}`,
    'Content-Type': 'application/json',
    'X-Runway-Version': '2024-11-06', // Header requerido
  },
});

export interface RunwayVideoRequest {
  promptText: string;
  ratio?: '1280:720' | '720:1280' | '1024:1024'; // Ratios disponibles
  audio?: boolean;
  duration?: number; // Duración en segundos
  model?: 'veo3.1'; // Modelo disponible
}

export interface RunwayTaskResponse {
  id: string; // ID de la tarea
}

export interface RunwayTaskStatus {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  progress?: number;
  output?: string[]; // URLs de los videos generados
  failure?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Crear una nueva tarea de generación de video text-to-video
 */
export const crearVideoTextToVideo = async (
  request: RunwayVideoRequest,
): Promise<RunwayTaskResponse> => {
  try {
    console.log('🎬 [RUNWAY] Iniciando generación text-to-video:', request);

    // Estructura exacta como en Postman que funciona
    const requestBody = {
      promptText: request.promptText,
      ratio: '1280:720', // Cambio a horizontal como en Postman exitoso
      audio: true,
      duration: 2,
      model: 'veo3.1',
    };

    console.log(
      '🎬 [RUNWAY] Request body:',
      JSON.stringify(requestBody, null, 2),
    );

    const response = await runwayApi.post('/v1/text_to_video', requestBody);

    console.log('🎬 [RUNWAY] Tarea creada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [RUNWAY] Error creando video:', error);
    if (error.response) {
      console.error(
        'Response data:',
        JSON.stringify(error.response.data, null, 2),
      );
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw new Error(`Error creando video en Runway: ${error.message}`);
  }
};

/**
 * Verificar el estado de una tarea
 */
export const verificarEstadoTarea = async (
  taskId: string,
): Promise<RunwayTaskStatus> => {
  try {
    const response = await runwayApi.get(`/v1/tasks/${taskId}`);
    console.log(`🔍 [RUNWAY] Estado de tarea ${taskId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [RUNWAY] Error verificando estado:', error);
    throw new Error(`Error verificando estado de la tarea: ${error.message}`);
  }
};

/**
 * Descargar el video generado
 */
export const descargarVideoRunway = async (
  videoUrl: string,
  taskId: string,
): Promise<string> => {
  try {
    console.log('📥 [RUNWAY] Descargando video desde:', videoUrl);

    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
    });

    const videoDir = path.join(process.cwd(), 'uploads', 'videos');
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    const fileName = `runway_${taskId}_${Date.now()}.mp4`;
    const videoPath = path.join(videoDir, fileName);
    fs.writeFileSync(videoPath, Buffer.from(response.data));

    console.log('✅ [RUNWAY] Video descargado:', videoPath);
    return fileName; // Retornamos solo el nombre del archivo
  } catch (error) {
    console.error('❌ [RUNWAY] Error descargando video:', error);
    throw new Error(`Error descargando video: ${error.message}`);
  }
};

/**
 * Proceso completo: crear tarea, esperar y descargar video para TikTok
 */
export const generarVideoParaTikTok = async (
  promptText: string,
): Promise<string> => {
  try {
    console.log('🚀 [RUNWAY] Iniciando generación de video para TikTok...');

    // Configuración según Postman exitoso
    const request: RunwayVideoRequest = {
      promptText,
      ratio: '1280:720', // Formato horizontal como en Postman exitoso
      audio: true,
      duration: 2, // 2 segundos como solicitaste
      model: 'veo3.1',
    };

    // 1. Crear la tarea
    const task = await crearVideoTextToVideo(request);

    // 2. Polling para esperar que termine
    let estadoActual: RunwayTaskStatus;
    const maxIntentos = 120; // 20 minutos máximo (cada 10 segundos)
    let intentos = 0;

    console.log('⏳ [RUNWAY] Esperando generación del video...');

    do {
      if (intentos >= maxIntentos) {
        throw new Error(
          'Timeout esperando la generación del video (20 minutos)',
        );
      }

      // Esperar antes de verificar (excepto la primera vez)
      if (intentos > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 segundos
      }

      estadoActual = await verificarEstadoTarea(task.id);

      if (estadoActual.progress !== undefined) {
        console.log(
          `⏳ [RUNWAY] Progreso: ${estadoActual.progress}% | Estado: ${estadoActual.status}`,
        );
      }

      intentos++;
    } while (
      estadoActual.status === 'PENDING' ||
      estadoActual.status === 'RUNNING'
    );

    // 3. Verificar el resultado
    if (estadoActual.status === 'FAILED') {
      throw new Error(
        `Generación falló: ${estadoActual.failure || 'Error desconocido'}`,
      );
    }

    if (
      estadoActual.status === 'SUCCEEDED' &&
      estadoActual.output &&
      estadoActual.output.length > 0
    ) {
      // 4. Descargar el video
      const videoUrl = estadoActual.output[0];
      return await descargarVideoRunway(videoUrl, task.id);
    }

    throw new Error('Video no disponible después de la generación exitosa');
  } catch (error) {
    console.error('❌ [RUNWAY] Error en proceso completo:', error);
    throw error;
  }
};
