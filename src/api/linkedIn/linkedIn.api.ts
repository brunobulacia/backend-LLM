import axios from 'src/lib/axios';
import axiosNativo from 'axios'; // Para la subida directa de archivos
import { PublishContentDto } from './dto/publish-content.dto';
import {
  RegistrarSubidaDto,
  RegistrarSubidaResponseDto,
} from './dto/register-upload.dto';
import { ImageAssetDto } from './dto/image-asset.dto';

// LINKEDIN API URL
const baseUrl = 'https://api.linkedin.com/v2';

const linkedInToken = process.env.LINKEDIN_TOKEN || '';
const urnPerson = process.env.LINKEDIN_URN_PERSON || '';

axios.createInstance(baseUrl);

export const linkedInApi = axios.getInstance(baseUrl);

// 1. PUBLICAR CONTENIDO EN FORMA DE MENSAJE EN LINKEDIN
export const publishContent = async (publishContent: PublishContentDto) => {
  try {
    const response = await linkedInApi.post('/ugcPosts', publishContent, {
      headers: {
        Authorization: `Bearer ${linkedInToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error publicando contenido en LinkedIn:', error);
    throw error;
  }
};

// PASOS PARA PUBLICAR UNA IMAGEN (SIMILAR A INSTAGRAM)
// 1. REGISTRAR LA SUBIDA PARA OBTENER EL UPLOAD URL Y ASSET
export const registrarSubida =
  async (): Promise<RegistrarSubidaResponseDto> => {
    try {
      const registrarSubidaDto: RegistrarSubidaDto = {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${urnPerson}`, // Formato correcto del URN
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      };

      // Endpoint correcto según la documentación de LinkedIn API v2
      const response = await linkedInApi.post(
        '/assets?action=registerUpload',
        registrarSubidaDto,
        {
          headers: {
            Authorization: `Bearer ${linkedInToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error registrando la subida en LinkedIn:', error);
      throw error;
    }
  };

// 2. SUBIR LA IMAGEN AL UPLOAD URL OBTENIDO
export const subirImagenUploadUrl = async (uploadUrl: string, image: File) => {
  try {
    const formData = new FormData();
    formData.append('file', image);

    // Crear una nueva instancia para el upload URL específico
    axios.createInstance(uploadUrl);
    const uploadApi = axios.getInstance(uploadUrl);

    // LinkedIn upload requiere PUT en lugar de POST
    // Y no necesita el token de autorización para la subida del archivo
    const response = await uploadApi.put('', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${linkedInToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error subiendo la imagen a LinkedIn:', error);
    throw error;
  }
};

// 2.1 VERSIÓN ALTERNATIVA USANDO AXIOS NATIVO (Equivalente al cURL)
export const subirImagenUploadUrlNativo = async (
  uploadUrl: string,
  image: File,
) => {
  try {
    const formData = new FormData();
    formData.append('file', image);

    // Usando axios nativo directamente (equivalente a tu comando cURL)
    const response = await axiosNativo.put(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Configuración adicional para manejar el upload
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  } catch (error) {
    console.error(
      'Error subiendo la imagen a LinkedIn (versión nativa):',
      error,
    );
    throw error;
  }
};

// 3. PUBLICAR LA IMAGEN USANDO EL ASSET OBTENIDO
export const publishImage = async (caption: string, asset: string) => {
  try {
    let imageAssetDto: ImageAssetDto = {
      author: `urn:li:person:${urnPerson}`, // Formato correcto del URN
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: caption,
          },
          shareMediaCategory: 'IMAGE',
          media: [
            {
              status: 'READY',
              description: {
                text: caption,
              },
              media: asset, //ESTO ES EL ASSET DEVUELTO AL REGISTRAR LA SUBIDA
              title: {
                text: caption,
              },
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await linkedInApi.post('/ugcPosts', imageAssetDto, {
      headers: {
        Authorization: `Bearer ${linkedInToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error publicando la imagen en LinkedIn:', error);
    throw error;
  }
};

// 4. FUNCION COMPLETA PARA PUBLICAR UNA IMAGEN EN LINKEDIN
export const publicarImagenEnLinkedIn = async (
  caption: string,
  image: File,
) => {
  try {
    // PASO 1: REGISTRAR LA SUBIDA 😱
    const registroSubida = await registrarSubida();

    // OBTENER EL UPLOAD URL Y ASSET 👿
    const uploadUrl =
      registroSubida.value.uploadMechanism[
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
      ].uploadUrl;
    const asset = registroSubida.value.asset;

    // PASO 2: SUBIR LA IMAGEN AL UPLOAD URL
    await subirImagenUploadUrl(uploadUrl, image);

    // PASO 3: PUBLICAR LA IMAGEN USANDO EL ASSET OBTENIDO
    const publicacion = await publishImage(caption, asset);

    return publicacion.data;
  } catch (error) {
    console.error('Error publicando la imagen completa en LinkedIn:', error);
    throw error;
  }
};
