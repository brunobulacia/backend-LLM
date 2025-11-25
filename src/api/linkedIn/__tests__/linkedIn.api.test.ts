import {
  publishContent,
  registrarSubida,
  subirImagenUploadUrl,
  subirImagenUploadUrlNativo,
  publishImage,
  publicarImagenEnLinkedIn,
} from '../linkedIn.api';
import { PublishContentDto } from '../dto/publish-content.dto';
import { RegistrarSubidaResponseDto } from '../dto/register-upload.dto';

// Mock de axios customizado
jest.mock('src/lib/axios', () => ({
  createInstance: jest.fn(),
  getInstance: jest.fn(() => ({
    post: jest.fn(),
    put: jest.fn(),
  })),
}));

// Mock de axios nativo
jest.mock('axios', () => ({
  put: jest.fn(),
}));

// Mock de las variables de entorno
const mockEnv = {
  LINKEDIN_TOKEN: 'mock_linkedin_token',
  LINKEDIN_URN_PERSON: 'mock_linkedin_urn',
};

describe('LinkedIn API', () => {
  let mockAxiosInstance: any;
  let mockAxiosNativo: any;

  beforeEach(() => {
    // Reset de mocks
    jest.clearAllMocks();

    // Configurar las variables de entorno
    process.env.LINKEDIN_TOKEN = mockEnv.LINKEDIN_TOKEN;
    process.env.LINKEDIN_URN_PERSON = mockEnv.LINKEDIN_URN_PERSON;

    // Mock del axios instance
    mockAxiosInstance = {
      post: jest.fn(),
      put: jest.fn(),
    };

    const axios = require('src/lib/axios');
    axios.getInstance.mockReturnValue(mockAxiosInstance);

    // Mock de axios nativo
    mockAxiosNativo = require('axios');

    // Mock console para evitar spam en tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('publishContent', () => {
    it('debería publicar contenido exitosamente', async () => {
      // Arrange
      const publishContentDto: PublishContentDto = {
        author: `urn:li:person:${mockEnv.LINKEDIN_URN_PERSON}`,
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

      const expectedResponse = {
        id: 'urn:li:ugcPost:6789012345678901234',
        activity: 'urn:li:activity:6789012345678901234',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await publishContent(publishContentDto);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/ugcPosts',
        publishContentDto,
        {
          headers: {
            Authorization: `Bearer ${mockEnv.LINKEDIN_TOKEN}`,
          },
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar errores de publicación', async () => {
      // Arrange
      const publishContentDto: PublishContentDto = {
        author: `urn:li:person:${mockEnv.LINKEDIN_URN_PERSON}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: 'Content que fallará',
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const mockError = new Error('LinkedIn API error');
      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(publishContent(publishContentDto)).rejects.toThrow(
        'LinkedIn API error',
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error publicando contenido en LinkedIn:',
        mockError,
      );
    });
  });

  describe('registrarSubida', () => {
    it('debería registrar la subida exitosamente', async () => {
      // Arrange
      const expectedResponse: RegistrarSubidaResponseDto = {
        value: {
          mediaArtifact:
            'urn:li:digitalmediaMediaArtifact:(urn:li:digitalmediaRecipe:feedshare-image,urn:li:digitalmediaMediaArtifactClass:feedshare-uploaded-image,123456)',
          uploadMechanism: {
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
              uploadUrl: 'https://www.linkedin.com/dms-uploads/123456',
              headers: {
                'media-type-family': 'STILLIMAGE',
              },
            },
          },
          asset: 'urn:li:digitalmediaAsset:123456',
          assetRealTimeTopic:
            'urn:li:realtime:digitalmediaAssetActivity:123456',
        },
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await registrarSubida();

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/assets?action=registerUpload',
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: `urn:li:person:${mockEnv.LINKEDIN_URN_PERSON}`,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${mockEnv.LINKEDIN_TOKEN}`,
          },
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar errores de registro', async () => {
      // Arrange
      const mockError = new Error('Registration failed');
      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(registrarSubida()).rejects.toThrow('Registration failed');
      expect(console.error).toHaveBeenCalledWith(
        'Error registrando la subida en LinkedIn:',
        mockError,
      );
    });
  });

  describe('subirImagenUploadUrl', () => {
    it('debería subir imagen exitosamente usando axios customizado', async () => {
      // Arrange
      const uploadUrl = 'https://www.linkedin.com/dms-uploads/123456';
      const mockFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const expectedResponse = {
        status: 'uploaded',
      };

      // Mock para crear nueva instancia de axios para el upload URL
      const uploadAxiosInstance = {
        put: jest.fn().mockResolvedValue({ data: expectedResponse }),
      };

      const axios = require('src/lib/axios');
      axios.getInstance.mockReturnValue(uploadAxiosInstance);

      // Act
      const result = await subirImagenUploadUrl(uploadUrl, mockFile);

      // Assert
      expect(axios.createInstance).toHaveBeenCalledWith(uploadUrl);
      expect(axios.getInstance).toHaveBeenCalledWith(uploadUrl);
      expect(uploadAxiosInstance.put).toHaveBeenCalledWith(
        '',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${mockEnv.LINKEDIN_TOKEN}`,
          },
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar errores de subida', async () => {
      // Arrange
      const uploadUrl = 'https://www.linkedin.com/dms-uploads/invalid';
      const mockFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const mockError = new Error('Upload failed');

      const uploadAxiosInstance = {
        put: jest.fn().mockRejectedValue(mockError),
      };

      const axios = require('src/lib/axios');
      axios.getInstance.mockReturnValue(uploadAxiosInstance);

      // Act & Assert
      await expect(subirImagenUploadUrl(uploadUrl, mockFile)).rejects.toThrow(
        'Upload failed',
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error subiendo la imagen a LinkedIn:',
        mockError,
      );
    });
  });

  describe('subirImagenUploadUrlNativo', () => {
    it('debería subir imagen usando axios nativo', async () => {
      // Arrange
      const uploadUrl = 'https://www.linkedin.com/dms-uploads/native123';
      const mockFile = new File(['native test content'], 'native-test.jpg', {
        type: 'image/jpeg',
      });

      const expectedResponse = {
        status: 'uploaded_native',
      };

      mockAxiosNativo.put.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await subirImagenUploadUrlNativo(uploadUrl, mockFile);

      // Assert
      expect(mockAxiosNativo.put).toHaveBeenCalledWith(
        uploadUrl,
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar errores con axios nativo', async () => {
      // Arrange
      const uploadUrl = 'https://www.linkedin.com/dms-uploads/native-error';
      const mockFile = new File(['error content'], 'error.jpg', {
        type: 'image/jpeg',
      });

      const mockError = new Error('Native upload failed');
      mockAxiosNativo.put.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        subirImagenUploadUrlNativo(uploadUrl, mockFile),
      ).rejects.toThrow('Native upload failed');
      expect(console.error).toHaveBeenCalledWith(
        'Error subiendo la imagen a LinkedIn (versión nativa):',
        mockError,
      );
    });
  });

  describe('publishImage', () => {
    it('debería publicar imagen exitosamente', async () => {
      // Arrange
      const caption = 'Test image caption';
      const asset = 'urn:li:digitalmediaAsset:123456';

      const expectedResponse = {
        id: 'urn:li:ugcPost:6789012345678901234',
        activity: 'urn:li:activity:6789012345678901234',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: expectedResponse,
      });

      // Act
      const result = await publishImage(caption, asset);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/ugcPosts',
        {
          author: `urn:li:person:${mockEnv.LINKEDIN_URN_PERSON}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: caption,
              },
              shareMediaCategory: 'IMAGE',
              media: [
                {
                  status: 'READY',
                  description: {
                    text: caption,
                  },
                  media: asset,
                  title: {
                    text: caption,
                  },
                },
              ],
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${mockEnv.LINKEDIN_TOKEN}`,
          },
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debería manejar errores de publicación de imagen', async () => {
      // Arrange
      const caption = 'Caption que fallará';
      const asset = 'urn:li:digitalmediaAsset:invalid';

      const mockError = new Error('Image publication failed');
      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(publishImage(caption, asset)).rejects.toThrow(
        'Image publication failed',
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error publicando la imagen en LinkedIn:',
        mockError,
      );
    });
  });

  describe('publicarImagenEnLinkedIn', () => {
    it('debería completar el flujo completo de publicación de imagen', async () => {
      // Arrange
      const caption = 'Test complete image flow';
      const mockFile = new File(['complete flow content'], 'complete.jpg', {
        type: 'image/jpeg',
      });

      const registerResponse: RegistrarSubidaResponseDto = {
        value: {
          mediaArtifact: 'urn:li:digitalmediaMediaArtifact:123456',
          uploadMechanism: {
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
              uploadUrl: 'https://www.linkedin.com/dms-uploads/complete123',
              headers: {
                'media-type-family': 'STILLIMAGE',
              },
            },
          },
          asset: 'urn:li:digitalmediaAsset:complete123',
          assetRealTimeTopic:
            'urn:li:realtime:digitalmediaAssetActivity:complete123',
        },
      };

      const uploadResponse = {
        status: 'uploaded',
      };

      const publishResponse = {
        id: 'urn:li:ugcPost:complete123',
        activity: 'urn:li:activity:complete123',
      };

      // Mock del flujo completo
      // 1. Registro de subida
      mockAxiosInstance.post.mockResolvedValueOnce({ data: registerResponse });

      // 2. Subida de imagen (usando axios customizado)
      const uploadAxiosInstance = {
        put: jest.fn().mockResolvedValue({ data: uploadResponse }),
      };
      const axios = require('src/lib/axios');
      axios.getInstance.mockReturnValue(uploadAxiosInstance);

      // 3. Publicación
      mockAxiosInstance.post.mockResolvedValueOnce({ data: publishResponse });

      // Act
      const result = await publicarImagenEnLinkedIn(caption, mockFile);

      // Assert
      // Verificar que se llamó el registro
      expect(mockAxiosInstance.post).toHaveBeenNthCalledWith(
        1,
        '/assets?action=registerUpload',
        expect.any(Object),
        expect.any(Object),
      );

      // Verificar que se subió la imagen
      expect(uploadAxiosInstance.put).toHaveBeenCalledWith(
        '',
        expect.any(FormData),
        expect.any(Object),
      );

      // Verificar que se publicó
      expect(mockAxiosInstance.post).toHaveBeenNthCalledWith(
        2,
        '/ugcPosts',
        expect.objectContaining({
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: caption },
              shareMediaCategory: 'IMAGE',
              media: expect.arrayContaining([
                expect.objectContaining({
                  media: registerResponse.value.asset,
                }),
              ]),
            },
          },
        }),
        expect.any(Object),
      );

      expect(result).toEqual(publishResponse);
    });

    it('debería propagar errores del paso de registro', async () => {
      // Arrange
      const caption = 'Error en registro';
      const mockFile = new File(['error content'], 'error.jpg', {
        type: 'image/jpeg',
      });

      const mockError = new Error('Registration error');
      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(publicarImagenEnLinkedIn(caption, mockFile)).rejects.toThrow(
        'Registration error',
      );
    });

    it('debería propagar errores del paso de subida', async () => {
      // Arrange
      const caption = 'Error en subida';
      const mockFile = new File(['upload error content'], 'upload-error.jpg', {
        type: 'image/jpeg',
      });

      const registerResponse: RegistrarSubidaResponseDto = {
        value: {
          mediaArtifact: 'urn:li:digitalmediaMediaArtifact:error123',
          uploadMechanism: {
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
              uploadUrl: 'https://www.linkedin.com/dms-uploads/error123',
              headers: {
                'media-type-family': 'STILLIMAGE',
              },
            },
          },
          asset: 'urn:li:digitalmediaAsset:error123',
          assetRealTimeTopic:
            'urn:li:realtime:digitalmediaAssetActivity:error123',
        },
      };

      const uploadError = new Error('Upload error');

      // Mock registro exitoso, subida con error
      mockAxiosInstance.post.mockResolvedValueOnce({ data: registerResponse });

      const uploadAxiosInstance = {
        put: jest.fn().mockRejectedValue(uploadError),
      };
      const axios = require('src/lib/axios');
      axios.getInstance.mockReturnValue(uploadAxiosInstance);

      // Act & Assert
      await expect(publicarImagenEnLinkedIn(caption, mockFile)).rejects.toThrow(
        'Upload error',
      );
    });

    it('debería propagar errores del paso de publicación', async () => {
      // Arrange
      const caption = 'Error en publicación';
      const mockFile = new File(
        ['publish error content'],
        'publish-error.jpg',
        { type: 'image/jpeg' },
      );

      const registerResponse: RegistrarSubidaResponseDto = {
        value: {
          mediaArtifact: 'urn:li:digitalmediaMediaArtifact:publish123',
          uploadMechanism: {
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
              uploadUrl: 'https://www.linkedin.com/dms-uploads/publish123',
              headers: {
                'media-type-family': 'STILLIMAGE',
              },
            },
          },
          asset: 'urn:li:digitalmediaAsset:publish123',
          assetRealTimeTopic:
            'urn:li:realtime:digitalmediaAssetActivity:publish123',
        },
      };

      const uploadResponse = { status: 'uploaded' };
      const publishError = new Error('Publish error');

      // Mock registro y subida exitosos, publicación con error
      mockAxiosInstance.post.mockResolvedValueOnce({ data: registerResponse });

      const uploadAxiosInstance = {
        put: jest.fn().mockResolvedValue({ data: uploadResponse }),
      };
      const axios = require('src/lib/axios');
      axios.getInstance.mockReturnValue(uploadAxiosInstance);

      mockAxiosInstance.post.mockRejectedValueOnce(publishError);

      // Act & Assert
      await expect(publicarImagenEnLinkedIn(caption, mockFile)).rejects.toThrow(
        'Publish error',
      );
    });
  });

  describe('Configuration', () => {
    it('debería usar las variables de entorno correctas', () => {
      // Assert
      expect(process.env.LINKEDIN_TOKEN).toBe(mockEnv.LINKEDIN_TOKEN);
      expect(process.env.LINKEDIN_URN_PERSON).toBe(mockEnv.LINKEDIN_URN_PERSON);
    });

    it('debería crear la instancia de axios correctamente', () => {
      // Arrange
      const axios = require('src/lib/axios');

      // Assert
      expect(axios.createInstance).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2',
      );
      expect(axios.getInstance).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2',
      );
    });
  });
});
