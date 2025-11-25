// Mock del axios customizado
jest.mock('src/lib/axios', () => ({
  __esModule: true,
  default: {
    createInstance: jest.fn(),
    getInstance: jest.fn(() => ({
      post: jest.fn().mockResolvedValue({
        data: {
          data: {
            publish_id: 'publish_123456789',
            upload_url: 'https://mock-upload-url.com/upload',
          },
        },
      }),
    })),
  },
}));

import { crearCredencialesPublicacion } from '../tiktok.api';
import { CrearCredencialesDto } from '../dto/crear-credenciales.dto';

describe('TikTok API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TIKTOK_TOKEN = 'mock_tiktok_token';
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debería crear credenciales de publicación exitosamente', async () => {
    // Arrange
    const titulo = 'Test TikTok video';
    const videoSize = 1048576;

    // Act
    const result = await crearCredencialesPublicacion(titulo, videoSize);

    // Assert
    expect(result).toEqual({
      data: {
        publish_id: 'publish_123456789',
        upload_url: 'https://mock-upload-url.com/upload',
      },
    });
  });
});
