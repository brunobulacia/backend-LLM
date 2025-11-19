import axios from 'src/lib/axios';
import { PostStoryDto } from './dto/post-story.dto';

const baseUrl = 'https://gate.whapi.cloud/';

const whatsappToken = process.env.WHATSAPP_TOKEN || '';

axios.createInstance(baseUrl);

export const whatsappApi = axios.getInstance(baseUrl);

// 1. ENVIAR UN ESTADO (STORY) A WHATSAPP
export const sendStory = async (storyData: PostStoryDto) => {
  try {
    const response = await whatsappApi.post('/stories/send/media', storyData, {
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al enviar el estado a WhatsApp:', error);
    throw error;
  }
};
