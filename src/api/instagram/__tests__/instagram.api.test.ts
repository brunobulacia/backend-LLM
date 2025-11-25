// Mock del axios customizado
jest.mock('src/lib/axios', () => ({
  __esModule: true,
  default: {
    createInstance: jest.fn(),
    getInstance: jest.fn(() => ({
      post: jest
        .fn()
        .mockResolvedValueOnce({
          status: 200,
          data: { id: '17841405622493998' },
        })
        .mockResolvedValueOnce({
          data: { id: 'published_123' },
        }),
      get: jest.fn().mockResolvedValue({
        data: { status_code: 'FINISHED' },
      }),
    })),
  },
}));

import { postImageToInstagram } from '../instagram.api';
import { CreateContainerDto } from '../dto/create-container.dto';

describe('Instagram API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.META_ACCESS_TOKEN = 'mock_meta_token';
    process.env.IG_USER_ID = 'mock_ig_user_id';
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debería completar el flujo completo de publicación exitosamente', async () => {
    // Arrange
    const createContainerDto: CreateContainerDto = {
      image_url: 'https://example.com/test-image.jpg',
      caption: 'Test caption para Instagram',
      media_type: 'PHOTO',
    };

    // Act
    const result = await postImageToInstagram(createContainerDto);

    // Assert
    expect(result).toEqual({
      id: 'published_123',
    });
  });
});
