import axios from 'src/lib/axios';
import { CreateContainerDto } from './dto/create-container.dto';
import { PublishContainerDto } from './dto/publish-container.dto';

//GRAPH API URL
export const instagramUrl = 'https://graph.facebook.com/v24.0';

//EL TOKEN EXPIRA ASI QUE HAY QUE CAMBIARLO CADA CIERTO TIEMPO
export const instagramPageAccessToken = process.env.IG_PAGE_ACCESS_TOKEN || '';
export const instagramUserId = process.env.IG_USER_ID || '';

axios.createInstance(instagramUrl);

export const instagramApi = axios.getInstance(instagramUrl);

// 1. CREAR CONTENEDOR DE PUBLICACION EN INSTAGRAM
export const sendInstagramImage = async (
  createContainerDto: CreateContainerDto,
) => {
  try {
    const response = await instagramApi.post(
      `/${instagramUserId}/media?access_token=${instagramPageAccessToken}`,
      //BODY
      {
        ...createContainerDto,
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error al crear contenedor en Instagram:', error);
    throw error;
  }
};

// 2. PUBLICAR CONTENEDOR EN INSTAGRAM
export const publishInstagramImage = async (
  publishContainerDto: PublishContainerDto,
) => {
  try {
    const response = await instagramApi.post(
      `/${instagramUserId}/media_publish?access_token=${instagramPageAccessToken}`,
      //BODY
      {
        ...publishContainerDto,
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error al publicar imagen en Instagram:', error);
    throw error;
  }
};
