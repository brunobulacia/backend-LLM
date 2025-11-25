// Mock del axios customizado
jest.mock('src/lib/axios', () => ({
  __esModule: true,
  default: {
    createInstance: jest.fn(),
    getInstance: jest.fn(() => ({
      post: jest.fn().mockResolvedValue({
        data: { id: 'story_123', sent: true, success: true },
      }),
    })),
  },
}));

// Mock de fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  statSync: jest.fn(() => ({ size: 5120 })),
  createReadStream: jest.fn(() => 'mock-file-stream'),
}));

// Mock de path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

// Mock de FormData
const mockFormDataInstance = {
  append: jest.fn(),
  getHeaders: jest.fn().mockReturnValue({
    'content-type': 'multipart/form-data; boundary=mock-boundary',
  }),
};

jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => mockFormDataInstance);
});

import { sendStory } from '../whatsapp.api';
import { PostStoryDto } from '../dto/post-story.dto';

describe('WhatsApp API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WHATSAPP_TOKEN = 'mock_whatsapp_token';
    mockFormDataInstance.append.mockClear();
    mockFormDataInstance.getHeaders.mockClear();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debería enviar una story con imagen exitosamente', async () => {
    // Arrange
    const storyData: PostStoryDto = {
      caption: 'Test story caption',
      media: 'https://example.com/test-image.jpg',
      exclude_contacts: ['contact1', 'contact2'],
    };

    // Act
    const result = await sendStory(storyData);

    // Assert
    expect(result).toEqual({
      id: 'story_123',
      sent: true,
      success: true,
    });

    expect(mockFormDataInstance.append).toHaveBeenCalledWith(
      'caption',
      storyData.caption,
    );
    expect(mockFormDataInstance.append).toHaveBeenCalledWith(
      'exclude_contacts',
      JSON.stringify(storyData.exclude_contacts),
    );
    expect(mockFormDataInstance.append).toHaveBeenCalledWith(
      'media',
      'mock-file-stream',
      {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg',
      },
    );
  });
});
