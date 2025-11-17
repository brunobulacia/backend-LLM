import axios from 'src/lib/axios';
import { SendMessageDto } from './dto/send-message.dto';
import { SendImageDto } from './dto/send-image.dto';

//GRAPH API URL
const facebookUrl = 'https://graph.facebook.com/v24.0';

//EL TOKEN EXPIRA ASI QUE HAY QUE CAMBIARLO CADA CIERTO TIEMPO
const metaAccessToken = process.env.META_ACCESS_TOKEN || '';
const facebookPageId = process.env.FB_PAGE_ID || '';

axios.createInstance(facebookUrl);

export const facebookApi = axios.getInstance(facebookUrl);

//SUBIR UN MENSAJE A LA PAGINA DE FACEBOOK
export const sendFacebookMessage = async (sendMessageDto: SendMessageDto) => {
  try {
    const response = await facebookApi.post(
      `/${facebookPageId}/feed?message=${sendMessageDto.message}&access_token=${metaAccessToken}`,
    );
    return response.data;
  } catch (error) {
    console.error('Error al subir mensaje:', error);
    throw error;
  }
};

//SUBIR UNA IMAGEN A LA PAGINA DE FACEBOOK
export const sendFacebookImage = async (sendImageDto: SendImageDto) => {
  try {
    const response = await facebookApi.post(
      `${facebookPageId}/photos?access_token=${metaAccessToken}`,
      {
        //BODY
        url: sendImageDto.imageUrl,
        caption: sendImageDto.caption,
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error al subir imagen:', error);
    throw error;
  }
};
