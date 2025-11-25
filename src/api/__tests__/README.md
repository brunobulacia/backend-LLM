# Tests Unitarios de APIs de Redes Sociales

Este directorio contiene tests unitarios simplificados para las 5 APIs de redes sociales del proyecto. Cada API tiene **1 test unitario** que cubre su funcionalidad principal.

## 📋 Estructura de Tests (1 test por API)

### ✅ Test Suites Incluidas

| API           | Archivo de Test                             | Función Testeada                 | Estado  |
| ------------- | ------------------------------------------- | -------------------------------- | ------- |
| **WhatsApp**  | `whatsapp/__tests__/whatsapp.api.test.ts`   | `sendStory()`                    | ✅ PASS |
| **Facebook**  | `facebook/__tests__/facebook.api.test.ts`   | `sendFacebookMessage()`          | ✅ PASS |
| **Instagram** | `instagram/__tests__/instagram.api.test.ts` | `postImageToInstagram()`         | ✅ PASS |
| **LinkedIn**  | `linkedIn/__tests__/linkedIn.api.test.ts`   | `publishContent()`               | ✅ PASS |
| **TikTok**    | `tiktok/__tests__/tiktok.api.test.ts`       | `crearCredencialesPublicacion()` | ✅ PASS |

## 🎯 Detalles de Cada Test

### 📱 WhatsApp API

- **Test**: `debería enviar una story con imagen exitosamente`
- **Función**: `sendStory(PostStoryDto)`
- **Mock**: FormData, fs, path, axios customizado
- **Validación**: FormData correcto, archivo procesado, respuesta exitosa

### 📘 Facebook API

- **Test**: `debería enviar un mensaje de texto exitosamente`
- **Función**: `sendFacebookMessage(SendMessageDto)`
- **Mock**: Axios customizado con Meta Graph API
- **Validación**: Mensaje enviado con tokens correctos

### 📸 Instagram API

- **Test**: `debería completar el flujo completo de publicación exitosamente`
- **Función**: `postImageToInstagram(CreateContainerDto)`
- **Mock**: Flujo de 2 pasos (crear contenedor + publicar)
- **Validación**: Proceso completo de publicación

### 💼 LinkedIn API

- **Test**: `debería publicar contenido exitosamente`
- **Función**: `publishContent(PublishContentDto)`
- **Mock**: UGC API de LinkedIn
- **Validación**: Contenido publicado con URN correcto

### 🎵 TikTok API

- **Test**: `debería crear credenciales de publicación exitosamente`
- **Función**: `crearCredencialesPublicacion(string, number?)`
- **Mock**: API de inicialización de TikTok
- **Validación**: Credenciales y URL de subida generadas

## 🛠️ Configuración de Mocks

### Mocks por Test (Inline)

Cada test incluye sus propios mocks inline para máxima simplicidad:

```typescript
// Ejemplo de mock inline de axios customizado
jest.mock('src/lib/axios', () => ({
  __esModule: true,
  default: {
    createInstance: jest.fn(),
    getInstance: jest.fn(() => ({
      post: jest.fn().mockResolvedValue({
        data: { success: true },
      }),
    })),
  },
}));
```

### Mock Global (Opcional)

Solo se mantiene el mock de axios nativo en `src/lib/__mocks__/axios.ts` para casos especiales.

## ⚡ Ejecución de Tests

```bash
# Ejecutar todos los tests de APIs (5 tests)
npm test src/api

# Ejecutar test específico
npm test src/api/whatsapp
npm test src/api/facebook
npm test src/api/instagram
npm test src/api/linkedIn
npm test src/api/tiktok

# Con output detallado
npm test src/api -- --verbose
```

## 📊 Resultados Esperados

```bash
✅ Test Suites: 5 passed, 5 total
✅ Tests:       5 passed, 5 total
⏱️ Time:        ~4-5 seconds
```

## 🏗️ Arquitectura de Test

### Estructura Simplificada

```
src/api/
├── facebook/__tests__/facebook.api.test.ts     (1 test)
├── instagram/__tests__/instagram.api.test.ts   (1 test)
├── linkedIn/__tests__/linkedIn.api.test.ts     (1 test)
├── whatsapp/__tests__/whatsapp.api.test.ts     (1 test)
├── tiktok/__tests__/tiktok.api.test.ts         (1 test)
└── __tests__/README.md                         (esta documentación)
```

### Patrón de Test

Cada test sigue el mismo patrón:

1. **Mocks Inline**: Configuración específica al inicio
2. **Setup**: `beforeEach` con variables de entorno y limpieza
3. **Test Único**: Un solo `it()` que cubre el caso principal
4. **Assertions**: Verificación de resultado y comportamiento
5. **Cleanup**: `afterEach` para limpiar mocks

## 🚀 Beneficios de la Simplificación

- ✅ **Ejecución rápida**: ~4-5 segundos vs. minutos anteriores
- ✅ **Mantenimiento simple**: 1 test por archivo
- ✅ **Mocks confiables**: Configuración inline específica
- ✅ **Cobertura esencial**: Función principal de cada API
- ✅ **Debug fácil**: Menos complejidad, errores más claros
- ✅ **CI/CD friendly**: Tests estables para integración continua

## 📝 Notas de Desarrollo

- Los mocks están configurados inline en cada test para evitar dependencias
- Cada test mockea solo lo necesario para su función específica
- Variables de entorno se configuran en `beforeEach` de cada test
- Console logs están mockeados para output limpio
- Todos los tests son independientes y pueden ejecutarse por separado
