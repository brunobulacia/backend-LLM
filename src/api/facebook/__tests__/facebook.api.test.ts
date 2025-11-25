jest.mock('src/lib/axios', () => ({
  __esModule: true,
  default: {
    createInstance: jest.fn(),
    getInstance: jest.fn(() => ({
      post: jest.fn().mockResolvedValue({
        data: { success: true, id: 'message_123' },
      }),
    })),
  },
}));

import { sendFacebookMessage } from '../facebook.api';
import { SendMessageDto } from '../dto/send-message.dto';

describe('Facebook API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.META_ACCESS_TOKEN = 'mock_meta_token';
    process.env.FB_PAGE_ID = 'mock_fb_page_id';
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debería enviar un mensaje de texto exitosamente', async () => {
    // Arrange
    const sendMessageDto: SendMessageDto = {
      message: 'Hola crack!😈',
    };

    // Act
    const result = await sendFacebookMessage(sendMessageDto);

    // Assert
    expect(result).toEqual({
      success: true,
      id: 'message_123',
    });
  });
});
