# Tests de APIs de Redes Sociales

Este directorio contiene tests unitarios completos para todas las APIs de redes sociales del proyecto.

## Estructura de Tests

### 📘 Facebook API (`facebook/__tests__/facebook.api.test.ts`)

- ✅ `sendFacebookMessage`: Envío de mensajes de texto
- ✅ `sendFacebookImage`: Publicación de imágenes con caption
- ✅ Manejo de errores y caracteres especiales
- ✅ Configuración de variables de entorno

### 📸 Instagram API (`instagram/__tests__/instagram.api.test.ts`)

- ✅ `sendInstagramImage`: Creación de contenedores
- ✅ `checkContainerStatus`: Verificación de estado
- ✅ `publishInstagramImage`: Publicación con reintentos
- ✅ `postImageToInstagram`: Flujo completo de publicación
- ✅ Manejo de errores de API y reintentos automáticos

### 💼 LinkedIn API (`linkedIn/__tests__/linkedIn.api.test.ts`)

- ✅ `publishContent`: Publicación de contenido de texto
- ✅ `registrarSubida`: Registro de subida de medios
- ✅ `subirImagenUploadUrl`: Subida usando axios customizado
- ✅ `subirImagenUploadUrlNativo`: Subida usando axios nativo
- ✅ `publishImage`: Publicación de imágenes
- ✅ `publicarImagenEnLinkedIn`: Flujo completo de imágenes

### 💬 WhatsApp API (`whatsapp/__tests__/whatsapp.api.test.ts`)

- ✅ `sendStory`: Envío de historias con medios
- ✅ Soporte para múltiples formatos: JPG, PNG, GIF, WEBP
- ✅ Manejo de archivos locales y URLs dummy
- ✅ FormData y streams de archivos
- ✅ Validación de existencia de archivos

### 🎵 TikTok API (`tiktok/__tests__/tiktok.api.test.ts`)

- ✅ `crearCredencialesPublicacion`: Crear credenciales de subida
- ✅ `subirVideoTikTok`: Subida binaria de videos
- ✅ `verEstadoPublicacion`: Monitoreo de estado
- ✅ `subirVideoCompletoTikTok`: Flujo completo con reintentos
- ✅ Modo demo para APIs no disponibles
- ✅ Manejo de timeouts y múltiples intentos

## Configuración de Mocks

### Archivos de Mock Globales

- `__mocks__/fs.ts`: Mock del sistema de archivos
- `__mocks__/form-data.ts`: Mock de FormData
- `__mocks__/axios.ts`: Mock de axios nativo
- `__tests__/setup.ts`: Configuración global de Jest

### Mocks Incluidos

- ✅ **File y Blob**: Constructores mockeados
- ✅ **FormData**: Implementación mock completa
- ✅ **fs**: `existsSync`, `readFileSync`, `createReadStream`, `statSync`
- ✅ **axios**: Instancias customizadas y nativo
- ✅ **Variables de entorno**: Tokens y configuración
- ✅ **Console**: Logs mockeados para tests limpios

## Características de los Tests

### ✨ Cobertura Completa

- **Casos exitosos**: Flujos normales de cada API
- **Manejo de errores**: Errores de red, API y validación
- **Edge cases**: URLs inválidas, archivos inexistentes, timeouts
- **Configuración**: Variables de entorno y setup de axios

### 🔄 Reintentos y Timeouts

- **Instagram**: Sistema de reintentos para publicación
- **TikTok**: Monitoreo de estado con múltiples intentos
- **LinkedIn**: Flujo multi-paso con validación
- **WhatsApp**: Validación de archivos y FormData

### 🎭 Modo Demo

- **TikTok**: Modo demo automático cuando API falla
- **Simulación**: Respuestas realistas para desarrollo
- **Logging**: Información detallada para debugging

### 📝 Validaciones

- **Parámetros requeridos**: Validación de entrada
- **Formatos de archivo**: Soporte multi-formato
- **URLs**: Manejo de URLs locales, remotas y dummy
- **Estados**: Verificación de estados de publicación

## Ejecución de Tests

```bash
# Ejecutar todos los tests de APIs
npm test src/api

# Ejecutar tests específicos
npm test src/api/facebook
npm test src/api/instagram
npm test src/api/linkedIn
npm test src/api/whatsapp
npm test src/api/tiktok

# Con cobertura
npm test -- --coverage src/api
```

## Estructura de Mock

Cada test incluye:

1. **Setup**: Configuración de mocks y variables
2. **Arrange**: Preparación de datos de prueba
3. **Act**: Ejecución de la función
4. **Assert**: Verificación de resultados y llamadas
5. **Cleanup**: Limpieza de mocks

Los mocks están diseñados para ser:

- **Realistas**: Simulan comportamiento real de APIs
- **Determinísticos**: Resultados predecibles
- **Aislados**: Sin dependencias externas
- **Informativos**: Logs claros para debugging
