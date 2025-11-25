// Configuración global de Jest para tests de APIs

// Mock global para File constructor
(global as any).File = jest
  .fn()
  .mockImplementation((bits: any[], name: string, options?: any) => ({
    name,
    size: 1024,
    type: options?.type || 'application/octet-stream',
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    stream: jest.fn(),
    text: jest.fn(),
    slice: jest.fn(),
  }));

// Mock global para Blob constructor
(global as any).Blob = jest
  .fn()
  .mockImplementation((parts: any[], options?: any) => ({
    size: 1024,
    type: options?.type || '',
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    stream: jest.fn(),
    text: jest.fn(),
    slice: jest.fn(),
  }));

// Mock global para FormData
global.FormData = jest.fn().mockImplementation(() => ({
  append: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  entries: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
})) as any;

// Mock para console.log, console.error, etc. para evitar spam en tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Mock para variables de entorno
process.env = {
  ...process.env,
  META_ACCESS_TOKEN: 'mock_meta_token',
  FB_PAGE_ID: 'mock_fb_page_id',
  IG_USER_ID: 'mock_ig_user_id',
  LINKEDIN_TOKEN: 'mock_linkedin_token',
  LINKEDIN_URN_PERSON: 'mock_linkedin_urn',
  WHATSAPP_TOKEN: 'mock_whatsapp_token',
  TIKTOK_TOKEN: 'mock_tiktok_token',
};
