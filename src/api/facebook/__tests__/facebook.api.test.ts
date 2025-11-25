import { sendFacebookMessage, sendFacebookImage } from '../facebook.api';
import { SendMessageDto } from '../dto/send-message.dto';
import { SendImageDto } from '../dto/send-image.dto';

// Mock de axios customizado
jest.mock('src/lib/axios', () => ({
  createInstance: jest.fn(),
  getInstance: jest.fn(() => ({
    post: jest.fn(),
  })),
}));

// Mock de las variables de entorno
const mockEnv = {
  META_ACCESS_TOKEN: 'mock_meta_token',
  FB_PAGE_ID: 'mock_fb_page_id',
};

describe('Facebook API', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset de mocks
    jest.clearAllMocks();

    // Configurar las variables de entorno
    process.env.META_ACCESS_TOKEN = mockEnv.META_ACCESS_TOKEN;
    process.env.FB_PAGE_ID = mockEnv.FB_PAGE_ID;

    // Mock del axios instance
    mockAxiosInstance = {
      post: jest.fn(),
    };

    const axios = require('src/lib/axios');
    axios.getInstance.mockReturnValue(mockAxiosInstance);
  });

  describe('sendFacebookMessage', () => {
    it('debería enviar un mensaje exitosamente', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = {
        message: 'Test message para Facebook',
      };

      const expectedResponse = {
        id: '123456789',
        message: 'Message posted successfully',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await sendFacebookMessage(sendMessageDto);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/${mockEnv.FB_PAGE_ID}/feed?message=${sendMessageDto.message}&access_token=${mockEnv.META_ACCESS_TOKEN}`,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar errores correctamente', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = {
        message: 'Test message que fallará',
      };

      const mockError = new Error('Facebook API error');
      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(sendFacebookMessage(sendMessageDto)).rejects.toThrow(
        'Facebook API error',
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/${mockEnv.FB_PAGE_ID}/feed?message=${sendMessageDto.message}&access_token=${mockEnv.META_ACCESS_TOKEN}`,
      );
    });

    it('debería manejar mensajes con caracteres especiales', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = {
        message: 'Mensaje con emojis 🚀 y símbolos especiales: @#$%',
      };

      const expectedResponse = {
        id: '987654321',
        message: 'Message with special characters posted',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await sendFacebookMessage(sendMessageDto);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/${mockEnv.FB_PAGE_ID}/feed?message=${sendMessageDto.message}&access_token=${mockEnv.META_ACCESS_TOKEN}`,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('sendFacebookImage', () => {
    it('debería enviar una imagen exitosamente', async () => {
      // Arrange
      const sendImageDto: SendImageDto = {
        imageUrl: 'https://example.com/test-image.jpg',
        caption: 'Test caption para la imagen',
      };

      const expectedResponse = {
        id: '555666777',
        post_id: '123456_555666777',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await sendFacebookImage(sendImageDto);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `${mockEnv.FB_PAGE_ID}/photos?access_token=${mockEnv.META_ACCESS_TOKEN}`,
        {
          url: sendImageDto.imageUrl,
          caption: sendImageDto.caption,
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar imágenes sin caption', async () => {
      // Arrange
      const sendImageDto: SendImageDto = {
        imageUrl: 'https://example.com/image-without-caption.png',
        caption: '',
      };

      const expectedResponse = {
        id: '888999000',
        post_id: '123456_888999000',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await sendFacebookImage(sendImageDto);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `${mockEnv.FB_PAGE_ID}/photos?access_token=${mockEnv.META_ACCESS_TOKEN}`,
        {
          url: sendImageDto.imageUrl,
          caption: sendImageDto.caption,
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar errores al subir imagen', async () => {
      // Arrange
      const sendImageDto: SendImageDto = {
        imageUrl: 'https://example.com/invalid-image.jpg',
        caption: 'Caption para imagen inválida',
      };

      const mockError = new Error('Invalid image URL');
      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(sendFacebookImage(sendImageDto)).rejects.toThrow(
        'Invalid image URL',
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `${mockEnv.FB_PAGE_ID}/photos?access_token=${mockEnv.META_ACCESS_TOKEN}`,
        {
          url: sendImageDto.imageUrl,
          caption: sendImageDto.caption,
        },
      );
    });

    it('debería manejar URLs de imagen locales', async () => {
      // Arrange
      const sendImageDto: SendImageDto = {
        imageUrl: 'file:///local/path/to/image.jpg',
        caption: 'Imagen local de prueba',
      };

      const expectedResponse = {
        id: '111222333',
        post_id: '123456_111222333',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await sendFacebookImage(sendImageDto);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `${mockEnv.FB_PAGE_ID}/photos?access_token=${mockEnv.META_ACCESS_TOKEN}`,
        {
          url: sendImageDto.imageUrl,
          caption: sendImageDto.caption,
        },
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('Configuration', () => {
    it('debería usar las variables de entorno correctas', () => {
      // Assert
      expect(process.env.META_ACCESS_TOKEN).toBe(mockEnv.META_ACCESS_TOKEN);
      expect(process.env.FB_PAGE_ID).toBe(mockEnv.FB_PAGE_ID);
    });

    it('debería crear la instancia de axios correctamente', () => {
      // Arrange
      const axios = require('src/lib/axios');

      // Assert
      expect(axios.createInstance).toHaveBeenCalledWith(
        'https://graph.facebook.com/v24.0',
      );
      expect(axios.getInstance).toHaveBeenCalledWith(
        'https://graph.facebook.com/v24.0',
      );
    });
  });
});
