import {
  sendInstagramImage,
  checkContainerStatus,
  publishInstagramImage,
  postImageToInstagram,
} from '../instagram.api';
import { CreateContainerDto } from '../dto/create-container.dto';
import { PublishContainerDto } from '../dto/publish-container.dto';

// Mock de axios customizado
jest.mock('src/lib/axios', () => ({
  createInstance: jest.fn(),
  getInstance: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
  })),
}));

// Mock para simular delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock de las variables de entorno
const mockEnv = {
  META_ACCESS_TOKEN: 'mock_meta_token',
  IG_USER_ID: 'mock_ig_user_id',
};

describe('Instagram API', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset de mocks
    jest.clearAllMocks();

    // Configurar las variables de entorno
    process.env.META_ACCESS_TOKEN = mockEnv.META_ACCESS_TOKEN;
    process.env.IG_USER_ID = mockEnv.IG_USER_ID;

    // Mock del axios instance
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const axios = require('src/lib/axios');
    axios.getInstance.mockReturnValue(mockAxiosInstance);

    // Mock console para evitar spam en tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendInstagramImage', () => {
    it('debería crear un contenedor exitosamente', async () => {
      // Arrange
      const createContainerDto: CreateContainerDto = {
        image_url: 'https://example.com/test-image.jpg',
        caption: 'Test caption para Instagram',
        media_type: 'PHOTO',
      };

      const expectedResponse = {
        id: '17841405622493998',
      };

      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: expectedResponse,
      });

      // Act
      const result = await sendInstagramImage(createContainerDto);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/${mockEnv.IG_USER_ID}/media?access_token=${mockEnv.META_ACCESS_TOKEN}`,
        createContainerDto,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar errores de API correctamente', async () => {
      // Arrange
      const createContainerDto: CreateContainerDto = {
        image_url: 'https://example.com/invalid-image.jpg',
        caption: 'Caption para imagen inválida',
      };

      const mockError = {
        response: {
          status: 400,
          data: {
            error: {
              message: 'Invalid image URL',
              type: 'OAuthException',
            },
          },
          headers: {},
        },
        message: 'Request failed with status code 400',
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(sendInstagramImage(createContainerDto)).rejects.toEqual(
        mockError,
      );
      expect(console.error).toHaveBeenCalledWith(
        '[INSTAGRAM-STEP1] Error completo:',
        mockError.response.data,
      );
    });

    it('debería logear información de debug correctamente', async () => {
      // Arrange
      const createContainerDto: CreateContainerDto = {
        image_url: 'https://example.com/debug-image.jpg',
        caption: 'Caption para debug',
      };

      const expectedResponse = {
        id: '12345678901234567',
      };

      mockAxiosInstance.post.mockResolvedValue({
        status: 201,
        data: expectedResponse,
      });

      // Act
      await sendInstagramImage(createContainerDto);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        '[INSTAGRAM-STEP1] URL:',
        `/${mockEnv.IG_USER_ID}/media`,
      );
      expect(console.log).toHaveBeenCalledWith(
        '[INSTAGRAM-STEP1] Body:',
        createContainerDto,
      );
      expect(console.log).toHaveBeenCalledWith(
        '[INSTAGRAM-STEP1] Status:',
        201,
      );
      expect(console.log).toHaveBeenCalledWith(
        '[INSTAGRAM-STEP1] Respuesta exitosa:',
        expectedResponse,
      );
    });
  });

  describe('checkContainerStatus', () => {
    it('debería verificar el estado del contenedor exitosamente', async () => {
      // Arrange
      const containerId = '17841405622493998';
      const expectedResponse = {
        status_code: 'FINISHED',
        status: 'FINISHED',
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await checkContainerStatus(containerId);

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/${containerId}?fields=status_code,status&access_token=${mockEnv.META_ACCESS_TOKEN}`,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería retornar null cuando hay error', async () => {
      // Arrange
      const containerId = '12345678901234567';
      const mockError = new Error('Container not found');

      mockAxiosInstance.get.mockRejectedValue(mockError);

      // Act
      const result = await checkContainerStatus(containerId);

      // Assert
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '[INSTAGRAM-STATUS] Error verificando estado:',
        mockError.message,
      );
    });

    it('debería manejar errores con response data', async () => {
      // Arrange
      const containerId = '98765432109876543';
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Container processing failed',
              type: 'OAuthException',
            },
          },
        },
        message: 'API Error',
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      // Act
      const result = await checkContainerStatus(containerId);

      // Assert
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '[INSTAGRAM-STATUS] Error verificando estado:',
        mockError.response.data,
      );
    });
  });

  describe('publishInstagramImage', () => {
    it('debería publicar el contenedor exitosamente', async () => {
      // Arrange
      const publishContainerDto: PublishContainerDto = {
        creation_id: '17841405622493998',
      };

      const expectedResponse = {
        id: '17880997618081620',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await publishInstagramImage(publishContainerDto);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/${mockEnv.IG_USER_ID}/media_publish?access_token=${mockEnv.META_ACCESS_TOKEN}`,
        publishContainerDto,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería reintentar en caso de error y finalmente tener éxito', async () => {
      // Arrange
      const publishContainerDto: PublishContainerDto = {
        creation_id: '17841405622493998',
      };

      const mockError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Temporary error' },
        },
        message: 'Server Error',
      };

      const expectedResponse = {
        id: '17880997618081620',
      };

      // Mock: primer y segundo intento fallan, tercero tiene éxito
      mockAxiosInstance.post
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ data: expectedResponse });

      // Mock del setTimeout para acelerar las pruebas
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      // Act
      const result = await publishInstagramImage(publishContainerDto);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
      expect(result).toEqual(expectedResponse);
      expect(console.error).toHaveBeenCalledWith(
        '[INSTAGRAM-STEP2] Error en intento 1:',
        {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Temporary error' },
          message: 'Server Error',
        },
      );
    });

    it('debería fallar después de máximo número de reintentos', async () => {
      // Arrange
      const publishContainerDto: PublishContainerDto = {
        creation_id: '17841405622493998',
      };

      const mockError = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid container' },
        },
        message: 'Bad Request',
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Mock del setTimeout
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      // Act & Assert
      await expect(publishInstagramImage(publishContainerDto)).rejects.toEqual(
        mockError,
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3); // máximo de reintentos
      expect(console.error).toHaveBeenCalledWith(
        '[INSTAGRAM-STEP2] Todos los intentos fallaron',
      );
    });
  });

  describe('postImageToInstagram', () => {
    it('debería completar el flujo completo exitosamente', async () => {
      // Arrange
      const createContainerDto: CreateContainerDto = {
        image_url: 'https://example.com/complete-flow-image.jpg',
        caption: 'Test del flujo completo',
      };

      const containerResponse = {
        id: '17841405622493998',
      };

      const publishResponse = {
        id: '17880997618081620',
      };

      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: containerResponse }) // sendInstagramImage
        .mockResolvedValueOnce({ data: publishResponse }); // publishInstagramImage

      // Mock del setTimeout
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      // Act
      const result = await postImageToInstagram(createContainerDto);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      expect(mockAxiosInstance.post).toHaveBeenNthCalledWith(
        1,
        `/${mockEnv.IG_USER_ID}/media?access_token=${mockEnv.META_ACCESS_TOKEN}`,
        createContainerDto,
      );
      expect(mockAxiosInstance.post).toHaveBeenNthCalledWith(
        2,
        `/${mockEnv.IG_USER_ID}/media_publish?access_token=${mockEnv.META_ACCESS_TOKEN}`,
        { creation_id: containerResponse.id },
      );
      expect(result).toEqual(publishResponse);
    });

    it('debería fallar si no se recibe un ID de contenedor válido', async () => {
      // Arrange
      const createContainerDto: CreateContainerDto = {
        image_url: 'https://example.com/invalid-response.jpg',
        caption: 'Test sin ID válido',
      };

      const invalidResponse = {
        // Sin campo 'id'
        status: 'error',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: invalidResponse });

      // Act & Assert
      await expect(postImageToInstagram(createContainerDto)).rejects.toThrow(
        '[INSTAGRAM] No se recibió un ID de contenedor válido',
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });

    it('debería fallar si el contenedor es null/undefined', async () => {
      // Arrange
      const createContainerDto: CreateContainerDto = {
        image_url: 'https://example.com/null-response.jpg',
        caption: 'Test con respuesta null',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: null });

      // Act & Assert
      await expect(postImageToInstagram(createContainerDto)).rejects.toThrow(
        '[INSTAGRAM] No se recibió un ID de contenedor válido',
      );
    });

    it('debería propagar errores del paso de creación de contenedor', async () => {
      // Arrange
      const createContainerDto: CreateContainerDto = {
        image_url: 'https://example.com/creation-error.jpg',
        caption: 'Test que falla en creación',
      };

      const mockError = new Error('Container creation failed');
      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(postImageToInstagram(createContainerDto)).rejects.toThrow(
        'Container creation failed',
      );
    });

    it('debería propagar errores del paso de publicación', async () => {
      // Arrange
      const createContainerDto: CreateContainerDto = {
        image_url: 'https://example.com/publish-error.jpg',
        caption: 'Test que falla en publicación',
      };

      const containerResponse = {
        id: '17841405622493998',
      };

      const publishError = new Error('Publication failed');

      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: containerResponse }) // Creación exitosa
        .mockRejectedValueOnce(publishError); // Publicación falla

      // Mock del setTimeout
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      // Act & Assert
      await expect(postImageToInstagram(createContainerDto)).rejects.toThrow(
        'Publication failed',
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration', () => {
    it('debería usar las variables de entorno correctas', () => {
      // Assert
      expect(process.env.META_ACCESS_TOKEN).toBe(mockEnv.META_ACCESS_TOKEN);
      expect(process.env.IG_USER_ID).toBe(mockEnv.IG_USER_ID);
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
