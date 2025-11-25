import {
  crearCredencialesPublicacion,
  subirVideoTikTok,
  verEstadoPublicacion,
  subirVideoCompletoTikTok,
} from '../tiktok.api';
import { CrearCredencialesDto } from '../dto/crear-credenciales.dto';

// Mock de axios customizado
jest.mock('src/lib/axios', () => ({
  createInstance: jest.fn(),
  getInstance: jest.fn(() => ({
    post: jest.fn(),
  })),
}));

// Mock de axios nativo
jest.mock('axios', () => ({
  put: jest.fn(),
}));

// Mock de fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Mock de path
jest.mock('path', () => ({
  join: jest.fn(),
}));

// Mock del DTO
jest.mock('../dto/crear-credenciales.dto', () => ({
  CrearCredencialesDto: jest.fn(),
}));

// Mock de las variables de entorno
const mockEnv = {
  TIKTOK_TOKEN: 'mock_tiktok_token',
};

describe('TikTok API', () => {
  let mockAxiosInstance: any;
  let mockAxiosNativo: any;
  let mockFs: any;
  let mockPath: any;
  let mockCrearCredencialesDto: any;

  beforeEach(() => {
    // Reset de mocks
    jest.clearAllMocks();

    // Configurar las variables de entorno
    process.env.TIKTOK_TOKEN = mockEnv.TIKTOK_TOKEN;

    // Mock del axios instance
    mockAxiosInstance = {
      post: jest.fn(),
    };

    const axios = require('src/lib/axios');
    axios.getInstance.mockReturnValue(mockAxiosInstance);

    // Mock de axios nativo
    mockAxiosNativo = require('axios');

    // Configurar mocks
    mockFs = require('fs');
    mockPath = require('path');
    mockCrearCredencialesDto =
      require('../dto/crear-credenciales.dto').CrearCredencialesDto;

    // Mock console para evitar spam en tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    // Mock de setTimeout para acelerar tests
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return {} as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('crearCredencialesPublicacion', () => {
    it('debería crear credenciales exitosamente', async () => {
      // Arrange
      const titulo = 'Test TikTok Video';
      const videoSize = 1024000;

      const mockCredenciales = {
        post_info: {
          title: titulo,
          privacy_level: 'SELF_ONLY',
          disable_duet: false,
          disable_comment: true,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1,
        },
      };

      const expectedResponse = {
        upload_url: 'https://upload.tiktok.com/video/123456',
        publish_id: 'publish_123456789',
      };

      mockCrearCredencialesDto.mockReturnValue(mockCredenciales);
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: expectedResponse,
      });

      // Act
      const result = await crearCredencialesPublicacion(titulo, videoSize);

      // Assert
      expect(mockCrearCredencialesDto).toHaveBeenCalledWith(titulo, videoSize);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v2/post/publish/video/init/',
        mockCredenciales,
        {
          headers: {
            Authorization: `Bearer ${mockEnv.TIKTOK_TOKEN}`,
          },
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar error de API y retornar respuesta demo', async () => {
      // Arrange
      const titulo = 'Test Video que falla';
      const videoSize = 512000;

      const mockCredenciales = {
        post_info: { title: titulo },
        source_info: { video_size: videoSize },
      };

      const mockError = new Error('TikTok API error');
      mockCrearCredencialesDto.mockReturnValue(mockCredenciales);
      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Act
      const result = await crearCredencialesPublicacion(titulo, videoSize);

      // Assert
      expect(result).toEqual({
        upload_url: 'https://demo-upload-url.com/fake-upload',
        publish_id: expect.stringMatching(/^demo_\d+_[a-z0-9]{9}$/),
      });
      expect(console.log).toHaveBeenCalledWith(
        '[TIKTOK] Error en API real, usando modo demo...',
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error details:',
        mockError.message,
      );
    });

    it('debería usar videoSize por defecto si no se proporciona', async () => {
      // Arrange
      const titulo = 'Video sin size';

      const mockCredencialesConDefault = {
        post_info: { title: titulo },
        source_info: { video_size: 574823 },
      };

      const expectedResponse = {
        upload_url: 'https://upload.tiktok.com/video/default',
        publish_id: 'publish_default',
      };

      mockCrearCredencialesDto.mockReturnValue(mockCredencialesConDefault);
      mockAxiosInstance.post.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await crearCredencialesPublicacion(titulo);

      // Assert
      expect(mockCrearCredencialesDto).toHaveBeenCalledWith(titulo, undefined);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('subirVideoTikTok', () => {
    it('debería subir video exitosamente', async () => {
      // Arrange
      const uploadUrl = 'https://upload.tiktok.com/video/real123';
      const mockArrayBuffer = new ArrayBuffer(1024);
      const mockFile = {
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      } as any;

      const expectedResponse = {
        status: 'uploaded',
        id: 'upload_123',
      };

      mockAxiosNativo.put.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: expectedResponse,
      });

      // Act
      const result = await subirVideoTikTok(mockFile, uploadUrl);

      // Assert
      expect(mockFile.arrayBuffer).toHaveBeenCalled();
      expect(mockAxiosNativo.put).toHaveBeenCalledWith(
        uploadUrl,
        Buffer.from(mockArrayBuffer),
        {
          headers: {
            'Content-Range': `bytes 0-1023/1024`,
            'Content-Type': 'video/mp4',
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar URL de demo', async () => {
      // Arrange
      const uploadUrl = 'https://demo-upload-url.com/fake-upload';
      const mockFile = {
        arrayBuffer: jest.fn(),
      } as any;

      // Act
      const result = await subirVideoTikTok(mockFile, uploadUrl);

      // Assert
      expect(mockFile.arrayBuffer).not.toHaveBeenCalled();
      expect(mockAxiosNativo.put).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: 'uploaded',
        message: 'Demo upload successful',
      });
      expect(console.log).toHaveBeenCalledWith(
        '📱 [TIKTOK] Simulando subida de video (modo demo)...',
      );
    });

    it('debería logear información de subida correctamente', async () => {
      // Arrange
      const uploadUrl =
        'https://upload.tiktok.com/video/verylongurl12345678901234567890';
      const mockArrayBuffer = new ArrayBuffer(2048);
      const mockFile = {
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      } as any;

      const expectedResponse = { status: 'uploaded' };
      mockAxiosNativo.put.mockResolvedValue({
        status: 201,
        statusText: 'Created',
        data: expectedResponse,
      });

      // Act
      await subirVideoTikTok(mockFile, uploadUrl);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        '📤 [TIKTOK] Iniciando subida binaria:',
        {
          uploadUrl: uploadUrl.substring(0, 60) + '...',
          videoSize: 2048,
          contentType: 'video/mp4',
        },
      );
      expect(console.log).toHaveBeenCalledWith(
        '📤 [TIKTOK] Respuesta de subida binaria:',
        {
          status: 201,
          statusText: 'Created',
          data: expectedResponse,
        },
      );
    });
  });

  describe('verEstadoPublicacion', () => {
    it('debería verificar estado exitosamente', async () => {
      // Arrange
      const publishId = 'publish_123456789';

      const expectedResponse = {
        data: {
          status: 'PUBLISH_COMPLETE',
          share_url: 'https://tiktok.com/@user/video/123456',
        },
      };

      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: expectedResponse,
      });

      // Act
      const result = await verEstadoPublicacion(publishId);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v2/post/publish/status/fetch/',
        {
          publish_id: publishId,
        },
        {
          headers: {
            Authorization: `Bearer ${mockEnv.TIKTOK_TOKEN}`,
          },
        },
      );
      expect(result).toEqual({
        status: 'published',
        message: 'Video published successfully',
        share_url: 'https://tiktok.com/@user/video/publish_123456789',
        tiktok_status: 'PUBLISH_COMPLETE',
      });
    });

    it('debería manejar respuesta sin data wrapper', async () => {
      // Arrange
      const publishId = 'publish_direct_123';

      const expectedResponse = {
        status: 'PROCESSING',
        progress: 75,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await verEstadoPublicacion(publishId);

      // Assert
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar publishId de demo', async () => {
      // Arrange
      const publishId = 'demo_123456789_abcdefgh';

      // Act
      const result = await verEstadoPublicacion(publishId);

      // Assert
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: 'published',
        message: 'Demo publication successful',
        share_url: `https://tiktok.com/@demo/video/${publishId}`,
      });
      expect(console.log).toHaveBeenCalledWith(
        '📱 [TIKTOK] Simulando estado de publicación (modo demo)...',
      );
    });

    it('debería lanzar error si publishId es vacío', async () => {
      // Arrange
      const publishId = '';

      // Act & Assert
      await expect(verEstadoPublicacion(publishId)).rejects.toThrow(
        'publishId es requerido para verificar el estado de publicación',
      );
    });

    it('debería manejar error de API y asumir éxito', async () => {
      // Arrange
      const publishId = 'publish_error_123';

      const mockError = new Error('API timeout');
      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Act
      const result = await verEstadoPublicacion(publishId);

      // Assert
      expect(result).toEqual({
        status: 'published',
        message: 'Status check failed, assuming success after upload',
        share_url: `https://tiktok.com/@user/video/${publishId}`,
      });
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ [TIKTOK] Error al verificar estado, asumiendo éxito:',
        mockError.message,
      );
    });
  });

  describe('subirVideoCompletoTikTok', () => {
    it('debería completar el flujo completo exitosamente', async () => {
      // Arrange
      const titulo = 'Video completo test';
      const videoFileName = 'test-video.mp4';
      const videoPath = '/mock/uploads/videos/test-video.mp4';
      const mockBuffer = Buffer.from('video content');

      // Configurar mocks
      mockPath.join.mockReturnValue(videoPath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockBuffer);

      const mockCredenciales = {
        upload_url: 'https://upload.tiktok.com/video/complete123',
        publish_id: 'publish_complete_123',
      };

      const mockCrearCredencialesDtoResponse = {
        post_info: { title: titulo },
        source_info: { video_size: mockBuffer.length },
      };

      mockCrearCredencialesDto.mockReturnValue(
        mockCrearCredencialesDtoResponse,
      );
      mockAxiosInstance.post.mockResolvedValue({ data: mockCredenciales });

      const uploadResponse = { status: 'uploaded' };
      mockAxiosNativo.put.mockResolvedValue({ data: uploadResponse });

      const estadoResponse = {
        status: 'published',
        share_url: 'https://tiktok.com/@user/video/complete123',
      };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockCredenciales }); // para credenciales
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { data: { status: 'PUBLISH_COMPLETE' } },
      }); // para estado

      // Act
      const result = await subirVideoCompletoTikTok(titulo, videoFileName);

      // Assert
      expect(mockPath.join).toHaveBeenCalledWith(
        process.cwd(),
        'uploads',
        'videos',
        videoFileName,
      );
      expect(mockFs.existsSync).toHaveBeenCalledWith(videoPath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(videoPath);
      expect(mockCrearCredencialesDto).toHaveBeenCalledWith(
        titulo,
        mockBuffer.length,
      );

      // Verificar que se llamaron las APIs en orden
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      expect(mockAxiosNativo.put).toHaveBeenCalledTimes(1);

      expect(result.status).toBe('published');
    });

    it('debería lanzar error si el video no existe', async () => {
      // Arrange
      const titulo = 'Video inexistente';
      const videoFileName = 'nonexistent.mp4';
      const videoPath = '/mock/uploads/videos/nonexistent.mp4';

      mockPath.join.mockReturnValue(videoPath);
      mockFs.existsSync.mockReturnValue(false);

      // Act & Assert
      await expect(
        subirVideoCompletoTikTok(titulo, videoFileName),
      ).rejects.toThrow(`Video no encontrado: ${videoPath}`);
      expect(mockFs.existsSync).toHaveBeenCalledWith(videoPath);
    });

    it('debería usar modo demo forzado cuando las credenciales fallan', async () => {
      // Arrange
      const titulo = 'Video con credenciales incompletas';
      const videoFileName = 'incomplete-credentials.mp4';
      const videoPath = '/mock/uploads/videos/incomplete-credentials.mp4';
      const mockBuffer = Buffer.from('video content');

      // Configurar mocks
      mockPath.join.mockReturnValue(videoPath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockBuffer);

      const mockCredencialesIncompletas = {
        // Sin upload_url ni publish_id
        some_other_field: 'value',
      };

      mockCrearCredencialesDto.mockReturnValue({});
      mockAxiosInstance.post.mockResolvedValue({
        data: mockCredencialesIncompletas,
      });

      // Act
      const result = await subirVideoCompletoTikTok(titulo, videoFileName);

      // Assert
      expect(result).toEqual({
        status: 'published',
        message: 'Demo publication successful (forced)',
        share_url: expect.stringMatching(
          /^https:\/\/tiktok\.com\/@demo\/video\/demo_\d+_[a-z0-9]{9}$/,
        ),
      });
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ [TIKTOK] Credenciales incompletas, usando modo demo forzado',
      );
    });

    it('debería monitorear estado con múltiples intentos en modo producción', async () => {
      // Arrange
      const titulo = 'Video con monitoreo';
      const videoFileName = 'monitoring-video.mp4';
      const videoPath = '/mock/uploads/videos/monitoring-video.mp4';
      const mockBuffer = Buffer.from('video content');

      // Configurar mocks
      mockPath.join.mockReturnValue(videoPath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockBuffer);

      const mockCredenciales = {
        upload_url: 'https://upload.tiktok.com/video/monitoring123',
        publish_id: 'publish_monitoring_123', // NO es demo
      };

      mockCrearCredencialesDto.mockReturnValue({});
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockCredenciales }); // credenciales
      mockAxiosNativo.put.mockResolvedValue({ data: { status: 'uploaded' } }); // upload

      // Simular estados progresivos: processing -> processing -> published
      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: { data: { status: 'PROCESSING' } } })
        .mockResolvedValueOnce({ data: { data: { status: 'PROCESSING' } } })
        .mockResolvedValueOnce({
          data: { data: { status: 'PUBLISH_COMPLETE' } },
        });

      // Act
      const result = await subirVideoCompletoTikTok(titulo, videoFileName);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(4); // 1 credenciales + 3 estados
      expect(result.status).toBe('published');
      expect(result.tiktok_status).toBe('PUBLISH_COMPLETE');
    });

    it('debería manejar timeout de monitoreo', async () => {
      // Arrange
      const titulo = 'Video con timeout';
      const videoFileName = 'timeout-video.mp4';
      const videoPath = '/mock/uploads/videos/timeout-video.mp4';
      const mockBuffer = Buffer.from('video content');

      // Configurar mocks
      mockPath.join.mockReturnValue(videoPath);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockBuffer);

      const mockCredenciales = {
        upload_url: 'https://upload.tiktok.com/video/timeout123',
        publish_id: 'publish_timeout_123',
      };

      mockCrearCredencialesDto.mockReturnValue({});
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockCredenciales });
      mockAxiosNativo.put.mockResolvedValue({ data: { status: 'uploaded' } });

      // Simular que siempre está en processing (timeout)
      mockAxiosInstance.post.mockResolvedValue({
        data: { data: { status: 'PROCESSING' } },
      });

      // Act
      const result = await subirVideoCompletoTikTok(titulo, videoFileName);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(13); // 1 credenciales + 12 intentos de estado
      expect(result.status).toBe('published'); // Asume éxito después del timeout
      expect(console.log).toHaveBeenCalledWith(
        '⚠️ [TIKTOK] Timeout esperando publicación, último estado:',
        'published',
      );
    });
  });

  describe('Configuration', () => {
    it('debería usar las variables de entorno correctas', () => {
      // Assert
      expect(process.env.TIKTOK_TOKEN).toBe(mockEnv.TIKTOK_TOKEN);
    });

    it('debería crear la instancia de axios correctamente', () => {
      // Arrange
      const axios = require('src/lib/axios');

      // Assert
      expect(axios.createInstance).toHaveBeenCalledWith(
        'https://open.tiktokapis.com',
      );
      expect(axios.getInstance).toHaveBeenCalledWith(
        'https://open.tiktokapis.com',
      );
    });
  });
});
