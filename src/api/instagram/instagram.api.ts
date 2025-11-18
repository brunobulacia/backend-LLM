import axios from 'src/lib/axios';
import { CreateContainerDto } from './dto/create-container.dto';
import { PublishContainerDto } from './dto/publish-container.dto';

//GRAPH API URL - Updated for debugging
export const instagramUrl = 'https://graph.facebook.com/v24.0';

//EL TOKEN EXPIRA ASI QUE HAY QUE CAMBIARLO CADA CIERTO TIEMPO
export const metaAccessToken = process.env.META_ACCESS_TOKEN || '';
export const instagramUserId = process.env.IG_USER_ID || '';

axios.createInstance(instagramUrl);

export const instagramApi = axios.getInstance(instagramUrl);

// 1. CREAR CONTENEDOR DE PUBLICACION EN INSTAGRAM
export const sendInstagramImage = async (
  createContainerDto: CreateContainerDto,
) => {
  try {
    console.log('[INSTAGRAM-STEP1] URL:', `/${instagramUserId}/media`);
    console.log('[INSTAGRAM-STEP1] Body:', createContainerDto);
    console.log('INSTAGRAM-STEP1] User ID:', instagramUserId);

    const response = await instagramApi.post(
      `/${instagramUserId}/media?access_token=${metaAccessToken}`,
      //BODY
      {
        ...createContainerDto,
      },
    );

    console.log('[INSTAGRAM-STEP1] Status:', response.status);
    console.log('[INSTAGRAM-STEP1] Respuesta exitosa:', response.data);
    console.log(
      '[INSTAGRAM-STEP1] Respuesta completa:',
      JSON.stringify(response.data, null, 2),
    );
    return response.data;
  } catch (error) {
    console.error(
      '[INSTAGRAM-STEP1] Error completo:',
      error.response?.data || error.message,
    );
    console.error('[INSTAGRAM-STEP1] Status Code:', error.response?.status);
    console.error('[INSTAGRAM-STEP1] Headers:', error.response?.headers);
    throw error;
  }
};

// VERIFICAR ESTADO DEL CONTENEDOR
export const checkContainerStatus = async (containerId: string) => {
  try {
    console.log('[INSTAGRAM-STATUS] Verificando contenedor:', containerId);

    const response = await instagramApi.get(
      `/${containerId}?fields=status_code,status&access_token=${metaAccessToken}`,
    );

    console.log('[INSTAGRAM-STATUS] Estado del contenedor:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      '[INSTAGRAM-STATUS] Error verificando estado:',
      error.response?.data || error.message,
    );
    return null;
  }
};

// 2. PUBLICAR CONTENEDOR EN INSTAGRAM CON REINTENTOS
export const publishInstagramImage = async (
  publishContainerDto: PublishContainerDto,
) => {
  const maxReintentos = 3;
  const tiempoEspera = 2000; // 2 segundos

  for (let intento = 1; intento <= maxReintentos; intento++) {
    try {
      console.log(
        `[INSTAGRAM-STEP2] Intento ${intento}/${maxReintentos} - URL:`,
        `/${instagramUserId}/media_publish`,
      );
      console.log('[INSTAGRAM-STEP2] Body:', publishContainerDto);

      // Verificar estado del contenedor antes de publicar
      const estado = await checkContainerStatus(
        publishContainerDto.creation_id,
      );
      if (estado) {
        console.log('🔍 [INSTAGRAM-STEP2] Estado del contenedor:', estado);
      }

      const response = await instagramApi.post(
        `/${instagramUserId}/media_publish?access_token=${metaAccessToken}`,
        //BODY
        {
          ...publishContainerDto,
        },
      );

      console.log('[INSTAGRAM-STEP2] Publicación exitosa:', response.data);
      return response.data;
    } catch (error) {
      console.error(`[INSTAGRAM-STEP2] Error en intento ${intento}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Si es el último intento, lanzar el error
      if (intento === maxReintentos) {
        console.error('[INSTAGRAM-STEP2] Todos los intentos fallaron');
        throw error;
      }

      // Esperar antes del próximo intento
      console.log(
        `⏳ [INSTAGRAM-STEP2] Esperando ${tiempoEspera}ms antes del próximo intento...`,
      );
      await new Promise((resolve) => setTimeout(resolve, tiempoEspera));
    }
  }
};

// FLUJO COMPLETO
export const postImageToInstagram = async (
  createContainerDto: CreateContainerDto,
) => {
  try {
    console.log('[INSTAGRAM] Iniciando flujo de publicación...');
    console.log('[INSTAGRAM] Datos del contenedor:', createContainerDto);

    // 1. Crear contenedor
    console.log(' [INSTAGRAM] Paso 1: Creando contenedor...');
    const contenedor = await sendInstagramImage(createContainerDto);
    console.log('[INSTAGRAM] Contenedor creado exitosamente:', contenedor);

    // Validar que tengamos un ID válido
    if (!contenedor || !contenedor.id) {
      throw new Error(
        `[INSTAGRAM] No se recibió un ID de contenedor válido. Respuesta: ${JSON.stringify(contenedor)}`,
      );
    }

    // Esperar un poco para que Instagram procese el contenedor
    const tiempoEsperaInicial = 3000; // 3 segundos
    console.log(
      `[INSTAGRAM] Esperando ${tiempoEsperaInicial}ms para que Instagram procese el contenedor...`,
    );
    await new Promise((resolve) => setTimeout(resolve, tiempoEsperaInicial));

    // 2. Publicar contenedor
    console.log(
      '[INSTAGRAM] Paso 2: Publicando contenedor con ID:',
      contenedor.id,
    );
    const publicacion = await publishInstagramImage({
      creation_id: contenedor.id,
    });
    console.log(
      '[INSTAGRAM] Publicación completada exitosamente:',
      publicacion,
    );

    return publicacion;
  } catch (error) {
    console.error('[INSTAGRAM] Error en el flujo de publicación:', error);
    throw error;
  }
};
