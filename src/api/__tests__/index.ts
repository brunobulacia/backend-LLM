import './setup';

// Configuración global para todos los tests de APIs de redes sociales
beforeAll(() => {
  // Configuración inicial que se ejecuta una vez antes de todos los tests
  console.log('🧪 Iniciando tests de APIs de redes sociales...');
});

afterAll(() => {
  // Limpieza que se ejecuta una vez después de todos los tests
  console.log('✅ Tests de APIs completados');
});

// Exportar utilidades comunes para tests
export const createMockFile = (
  name: string,
  content: string = 'mock content',
  type: string = 'text/plain',
) => {
  return new File([content], name, { type });
};

export const createMockFormData = () => {
  const formData = new FormData();
  return formData;
};

export const mockEnvironmentVariables = {
  META_ACCESS_TOKEN: 'mock_meta_token',
  FB_PAGE_ID: 'mock_fb_page_id',
  IG_USER_ID: 'mock_ig_user_id',
  LINKEDIN_TOKEN: 'mock_linkedin_token',
  LINKEDIN_URN_PERSON: 'mock_linkedin_urn',
  WHATSAPP_TOKEN: 'mock_whatsapp_token',
  TIKTOK_TOKEN: 'mock_tiktok_token',
};

export const mockApiResponses = {
  facebook: {
    message: { id: '123456789', message: 'Message posted successfully' },
    image: { id: '555666777', post_id: '123456_555666777' },
  },
  instagram: {
    container: { id: '17841405622493998' },
    publish: { id: '17880997618081620' },
    status: { status_code: 'FINISHED', status: 'FINISHED' },
  },
  linkedin: {
    content: {
      id: 'urn:li:ugcPost:6789012345678901234',
      activity: 'urn:li:activity:6789012345678901234',
    },
    upload: { status: 'uploaded' },
    register: {
      value: {
        mediaArtifact: 'urn:li:digitalmediaMediaArtifact:123456',
        uploadMechanism: {
          'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
            uploadUrl: 'https://www.linkedin.com/dms-uploads/123456',
            headers: { 'media-type-family': 'STILLIMAGE' },
          },
        },
        asset: 'urn:li:digitalmediaAsset:123456',
        assetRealTimeTopic: 'urn:li:realtime:digitalmediaAssetActivity:123456',
      },
    },
  },
  whatsapp: {
    story: { sent: true, id: 'story_123456789' },
  },
  tiktok: {
    credentials: {
      upload_url: 'https://upload.tiktok.com/video/123456',
      publish_id: 'publish_123456789',
    },
    upload: { status: 'uploaded' },
    status: {
      status: 'published',
      message: 'Video published successfully',
      share_url: 'https://tiktok.com/@user/video/123456',
    },
  },
};
