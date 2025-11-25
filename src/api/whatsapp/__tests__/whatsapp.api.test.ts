import { sendStory } from '../whatsapp.api';
import { PostStoryDto } from '../dto/post-story.dto';

// Mock de axios customizado
jest.mock('src/lib/axios', () => ({
  createInstance: jest.fn(),
  getInstance: jest.fn(() => ({
    post: jest.fn(),
  })),
}));

// Mock de fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  statSync: jest.fn(),
  createReadStream: jest.fn(),
}));

// Mock de path
jest.mock('path', () => ({
  join: jest.fn(),
}));

// Mock de FormData
jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({
      'content-type': 'multipart/form-data; boundary=mock-boundary',
    }),
  }));
});

// Mock de las variables de entorno
const mockEnv = {
  WHATSAPP_TOKEN: 'mock_whatsapp_token',
};

describe('WhatsApp API', () => {
  let mockAxiosInstance: any;
  let mockFs: any;
  let mockPath: any;
  let MockFormData: any;

  beforeEach(() => {
    // Reset de mocks
    jest.clearAllMocks();

    // Configurar las variables de entorno
    process.env.WHATSAPP_TOKEN = mockEnv.WHATSAPP_TOKEN;

    // Mock del axios instance
    mockAxiosInstance = {
      post: jest.fn(),
    };

    const axios = require('src/lib/axios');
    axios.getInstance.mockReturnValue(mockAxiosInstance);

    // Configurar mocks
    mockFs = require('fs');
    mockPath = require('path');
    MockFormData = require('form-data');

    // Mock console para evitar spam en tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendStory', () => {
    it('debería enviar una story con imagen exitosamente', async () => {
      // Arrange
      const storyData: PostStoryDto = {
        media: 'https://example.com/test-image.jpg',
        caption: 'Test story caption for WhatsApp',
        exclude_contacts: ['contact1', 'contact2'],
      };

      const fileName = 'test-image.jpg';
      const filePath = '/mock/uploads/images/test-image.jpg';
      const mockFileStream = { pipe: jest.fn() };

      // Configurar mocks
      mockPath.join.mockReturnValue(filePath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 1024 });
      mockFs.createReadStream.mockReturnValue(mockFileStream);

      const expectedResponse = {
        sent: true,
        id: 'story_123456789',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await sendStory(storyData);

      // Assert
      expect(mockPath.join).toHaveBeenCalledWith(
        process.cwd(),
        'uploads',
        'images',
        fileName,
      );
      expect(mockFs.existsSync).toHaveBeenCalledWith(filePath);
      expect(mockFs.createReadStream).toHaveBeenCalledWith(filePath);

      const formDataInstance = MockFormData.mock.instances[0];
      expect(formDataInstance.append).toHaveBeenCalledWith(
        'caption',
        storyData.caption,
      );
      expect(formDataInstance.append).toHaveBeenCalledWith(
        'exclude_contacts',
        JSON.stringify(storyData.exclude_contacts),
      );
      expect(formDataInstance.append).toHaveBeenCalledWith(
        'media',
        mockFileStream,
        {
          filename: fileName,
          contentType: 'image/jpeg',
        },
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/stories/send/media',
        expect.any(MockFormData),
        {
          headers: {
            Authorization: `Bearer ${mockEnv.WHATSAPP_TOKEN}`,
            'content-type': 'multipart/form-data; boundary=mock-boundary',
          },
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar imagen PNG correctamente', async () => {
      // Arrange
      const storyData: PostStoryDto = {
        media: 'https://example.com/test-image.png',
        caption: 'Test PNG story',
        exclude_contacts: [],
      };

      const fileName = 'test-image.png';
      const filePath = '/mock/uploads/images/test-image.png';
      const mockFileStream = { pipe: jest.fn() };

      // Configurar mocks
      mockPath.join.mockReturnValue(filePath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 2048 });
      mockFs.createReadStream.mockReturnValue(mockFileStream);

      const expectedResponse = { sent: true, id: 'story_png_123' };
      mockAxiosInstance.post.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await sendStory(storyData);

      // Assert
      const formDataInstance = MockFormData.mock.instances[0];
      expect(formDataInstance.append).toHaveBeenCalledWith(
        'media',
        mockFileStream,
        {
          filename: fileName,
          contentType: 'image/png',
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar imagen GIF correctamente', async () => {
      // Arrange
      const storyData: PostStoryDto = {
        media: 'https://example.com/test-image.gif',
        caption: 'Test GIF story',
        exclude_contacts: ['contact1'],
      };

      const fileName = 'test-image.gif';
      const filePath = '/mock/uploads/images/test-image.gif';
      const mockFileStream = { pipe: jest.fn() };

      // Configurar mocks
      mockPath.join.mockReturnValue(filePath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 4096 });
      mockFs.createReadStream.mockReturnValue(mockFileStream);

      const expectedResponse = { sent: true, id: 'story_gif_123' };
      mockAxiosInstance.post.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await sendStory(storyData);

      // Assert
      const formDataInstance = MockFormData.mock.instances[0];
      expect(formDataInstance.append).toHaveBeenCalledWith(
        'media',
        mockFileStream,
        {
          filename: fileName,
          contentType: 'image/gif',
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar imagen WEBP correctamente', async () => {
      // Arrange
      const storyData: PostStoryDto = {
        media: 'https://example.com/test-image.webp',
        caption: 'Test WEBP story',
        exclude_contacts: [],
      };

      const fileName = 'test-image.webp';
      const filePath = '/mock/uploads/images/test-image.webp';
      const mockFileStream = { pipe: jest.fn() };

      // Configurar mocks
      mockPath.join.mockReturnValue(filePath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 1536 });
      mockFs.createReadStream.mockReturnValue(mockFileStream);

      const expectedResponse = { sent: true, id: 'story_webp_123' };
      mockAxiosInstance.post.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await sendStory(storyData);

      // Assert
      const formDataInstance = MockFormData.mock.instances[0];
      expect(formDataInstance.append).toHaveBeenCalledWith(
        'media',
        mockFileStream,
        {
          filename: fileName,
          contentType: 'image/webp',
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar URLs dummy correctamente', async () => {
      // Arrange
      const storyData: PostStoryDto = {
        media: 'dummy:///dummy-image.jpg',
        caption: 'Test dummy story',
        exclude_contacts: ['contact1', 'contact2', 'contact3'],
      };

      const fileName = 'dummy-image.jpg';
      const filePath = '/mock/uploads/images/dummy-image.jpg';
      const mockFileStream = { pipe: jest.fn() };

      // Configurar mocks
      mockPath.join.mockReturnValue(filePath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 2048 });
      mockFs.createReadStream.mockReturnValue(mockFileStream);

      const expectedResponse = { sent: true, id: 'story_dummy_123' };
      mockAxiosInstance.post.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await sendStory(storyData);

      // Assert
      expect(mockPath.join).toHaveBeenCalledWith(
        process.cwd(),
        'uploads',
        'images',
        fileName,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería lanzar error si no se puede extraer el nombre del archivo', async () => {
      // Arrange
      const storyData: PostStoryDto = {
        media: 'https://example.com/',
        caption: 'Story without filename',
        exclude_contacts: [],
      };

      // Act & Assert
      await expect(sendStory(storyData)).rejects.toThrow(
        'No se pudo extraer el nombre del archivo de la URL',
      );
    });

    it('debería lanzar error si el archivo no existe', async () => {
      // Arrange
      const storyData: PostStoryDto = {
        media: 'https://example.com/nonexistent.jpg',
        caption: 'Story with nonexistent file',
        exclude_contacts: [],
      };

      const fileName = 'nonexistent.jpg';
      const filePath = '/mock/uploads/images/nonexistent.jpg';

      // Configurar mocks
      mockPath.join.mockReturnValue(filePath);
      mockFs.existsSync.mockReturnValue(false);

      // Act & Assert
      await expect(sendStory(storyData)).rejects.toThrow(
        `Archivo de imagen no encontrado: ${filePath}`,
      );
      expect(mockFs.existsSync).toHaveBeenCalledWith(filePath);
    });

    it('debería enviar story sin media', async () => {
      // Arrange
      const storyData: PostStoryDto = {
        media: null,
        caption: 'Story without media',
        exclude_contacts: ['contact1'],
      };

      const expectedResponse = { sent: true, id: 'story_no_media_123' };
      mockAxiosInstance.post.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await sendStory(storyData);

      // Assert
      const formDataInstance = MockFormData.mock.instances[0];
      expect(formDataInstance.append).toHaveBeenCalledWith(
        'caption',
        storyData.caption,
      );
      expect(formDataInstance.append).toHaveBeenCalledWith(
        'exclude_contacts',
        JSON.stringify(storyData.exclude_contacts),
      );
      expect(formDataInstance.append).not.toHaveBeenCalledWith(
        'media',
        expect.anything(),
        expect.anything(),
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar errores de API de WhatsApp', async () => {
      // Arrange
      const storyData: PostStoryDto = {
        media: 'https://example.com/error-image.jpg',
        caption: 'Story que causará error',
        exclude_contacts: [],
      };

      const fileName = 'error-image.jpg';
      const filePath = '/mock/uploads/images/error-image.jpg';
      const mockFileStream = { pipe: jest.fn() };

      // Configurar mocks
      mockPath.join.mockReturnValue(filePath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 1024 });
      mockFs.createReadStream.mockReturnValue(mockFileStream);

      const mockError = new Error('WhatsApp API error');
      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(sendStory(storyData)).rejects.toThrow('WhatsApp API error');
      expect(console.error).toHaveBeenCalledWith(
        'Error al enviar el estado a WhatsApp:',
        mockError,
      );
    });

    it('debería logear información de debug correctamente', async () => {
      // Arrange
      const storyData: PostStoryDto = {
        media: 'https://example.com/debug-image.jpg',
        caption:
          'A very long caption for testing truncation in debug logs that should be cut off at 50 characters',
        exclude_contacts: ['contact1', 'contact2', 'contact3', 'contact4'],
      };

      const fileName = 'debug-image.jpg';
      const filePath = '/mock/uploads/images/debug-image.jpg';
      const mockFileStream = { pipe: jest.fn() };

      // Configurar mocks
      mockPath.join.mockReturnValue(filePath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 5120 });
      mockFs.createReadStream.mockReturnValue(mockFileStream);

      const expectedResponse = { sent: true, id: 'story_debug_123' };
      mockAxiosInstance.post.mockResolvedValue({ data: expectedResponse });

      // Act
      await sendStory(storyData);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        '📱 [WHATSAPP] Enviando story con datos:',
        {
          mediaUrl: storyData.media,
          caption: storyData.caption.substring(0, 50) + '...',
          excludeContactsCount: storyData.exclude_contacts.length,
        },
      );
      expect(console.log).toHaveBeenCalledWith(
        '📁 [WHATSAPP] Archivo encontrado:',
        filePath,
      );
      expect(console.log).toHaveBeenCalledWith(
        '🖼️ [WHATSAPP] Configurando archivo:',
        {
          fileName,
          contentType: 'image/jpeg',
          size: 5120,
        },
      );
      expect(console.log).toHaveBeenCalledWith(
        '🚀 [WHATSAPP] Enviando FormData a WhatsApp API...',
      );
      expect(console.log).toHaveBeenCalledWith(
        '✅ [WHATSAPP] Respuesta exitosa:',
        expectedResponse,
      );
    });
  });

  describe('Configuration', () => {
    it('debería usar las variables de entorno correctas', () => {
      // Assert
      expect(process.env.WHATSAPP_TOKEN).toBe(mockEnv.WHATSAPP_TOKEN);
    });

    it('debería crear la instancia de axios correctamente', () => {
      // Arrange
      const axios = require('src/lib/axios');

      // Assert
      expect(axios.createInstance).toHaveBeenCalledWith(
        'https://gate.whapi.cloud/',
      );
      expect(axios.getInstance).toHaveBeenCalledWith(
        'https://gate.whapi.cloud/',
      );
    });
  });
});
