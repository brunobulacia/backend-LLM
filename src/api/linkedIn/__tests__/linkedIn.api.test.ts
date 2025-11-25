// Mock del axios customizado
jest.mock('src/lib/axios', () => ({
  __esModule: true,
  default: {
    createInstance: jest.fn(),
    getInstance: jest.fn(() => ({
      post: jest.fn().mockResolvedValue({
        data: {
          id: 'urn:li:ugcPost:6789012345678901234',
          activity: 'urn:li:activity:6789012345678901234',
        },
      }),
    })),
  },
}));

import { publishContent } from '../linkedIn.api';
import { PublishContentDto } from '../dto/publish-content.dto';

describe('LinkedIn API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LINKEDIN_TOKEN = 'mock_linkedin_token';
    process.env.LINKEDIN_URN_PERSON = 'mock_urn_person';
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debería publicar contenido exitosamente', async () => {
    // Arrange
    const publishContentDto: PublishContentDto = {
      author: 'urn:li:person:mock_urn_person',
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: 'Test post content for LinkedIn',
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Act
    const result = await publishContent(publishContentDto);

    // Assert
    expect(result).toEqual({
      id: 'urn:li:ugcPost:6789012345678901234',
      activity: 'urn:li:activity:6789012345678901234',
    });
  });
});
