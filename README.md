# Backend LLM - Sistema de Chat con IA para FICCT

Este proyecto es un backend desarrollado con NestJS que implementa un sistema de chat en tiempo real con inteligencia artificial, específicamente diseñado para generar publicaciones para redes sociales de la Facultad de Ingeniería de Ciencias de la Computación (FICCT) de la Universidad Autónoma Gabriel René Moreno.

## 🚀 Características

- **Chat en tiempo real** con WebSockets (Socket.io)
- **Integración con OpenAI GPT** para generación de contenido
- **Soporte para Ollama** como alternativa local
- **Base de datos PostgreSQL** con Prisma ORM
- **Generación de publicaciones** para múltiples redes sociales (Facebook, Instagram, WhatsApp, TikTok, LinkedIn)
- **Sistema de persistencia** de chats y mensajes

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   OpenAI API    │
│   (Cliente)     │◄──►│   (NestJS)       │◄──►│   / Ollama      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   PostgreSQL     │
                       │   (Prisma ORM)   │
                       └──────────────────┘
```

### Módulos Principales

1. **SocketChatModule**: Maneja las conexiones WebSocket y la comunicación en tiempo real
2. **ChatsModule**: CRUD de chats
3. **MensajesModule**: Gestión de mensajes
4. **PublicacionModule**: Manejo de publicaciones generadas
5. **PrismaModule**: Conexión y configuración de la base de datos

## 🔄 Flujo del LLM

### 1. Conexión WebSocket

```typescript
// El cliente se conecta via WebSocket
handleConnection(client: Socket) {
  this.socketChatService.addClient(client);
  // Notifica el número de conexiones activas
}
```

### 2. Procesamiento del Prompt

```typescript
@SubscribeMessage('prompt')
async handlePrompt(@MessageBody() data: { chatId: string; prompt: string })
```

**Flujo detallado:**

1. **Recepción del prompt**: El usuario envía un mensaje a través del WebSocket
2. **Persistencia del mensaje de usuario**: Se guarda en la base de datos con `emisor: 'USUARIO'`
3. **Llamada a OpenAI API**: Se envía el prompt junto con el system prompt especializado
4. **Streaming de respuesta**: La respuesta se transmite palabra por palabra en tiempo real
5. **Persistencia de respuesta**: Se guarda la respuesta completa con `emisor: 'LLM'`

### 3. System Prompt Especializado

El sistema utiliza un prompt específico para generar publicaciones de redes sociales:

```typescript
export const systemPrompt = `Eres un asistente inteligente y servicial especializado en ayudar a los usuarios a crear publicaciones atractivas para redes sociales...`;
```

**Características del System Prompt:**

- Especializado en FICCT (Facultad de Ingeniería de Ciencias de la Computación)
- Genera contenido para múltiples plataformas
- Respuesta estructurada en formato JSON
- Incluye títulos, descripciones y hashtags específicos por plataforma

### 4. Respuesta Estructurada

El LLM devuelve un JSON con el siguiente formato:

```json
{
  "facebook": {
    "titulo": "string",
    "descripcion": "string",
    "hashtags": ["string"]
  },
  "instagram": {
    "titulo": "string",
    "descripcion": "string",
    "hashtags": ["string"]
  },
  "whatsapp": {
    "titulo": "string"
  },
  "tiktok": {
    "titulo": "string",
    "hashtags": ["string"]
  },
  "linkedin": {
    "titulo": "string",
    "descripcion": "string"
  }
}
```

## 🔑 Configuración de OpenAI API Key

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# OpenAI Configuration
OPENAI_API_KEY=tu_api_key_aqui

# Database Configuration
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_db"

# Server Configuration
PORT=4000
```

### 2. Configuración en el Código

La API key se configura automáticamente en el constructor del WebSocket Gateway:

```typescript
// Crear instancia de OpenAI con API key
client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### 3. Obtener tu API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Navega a **API Keys** en tu dashboard
4. Haz clic en **"Create new secret key"**
5. Copia la clave y guárdala de forma segura
6. Agrega la clave a tu archivo `.env`

⚠️ **Importante**:

- Nunca expongas tu API key en el código fuente
- Manténla en variables de entorno
- No la subas a repositorios públicos
- Considera usar límites de uso y monitoreo de costos

## 📦 Instalación

### Prerrequisitos

- Node.js (v18 o superior)
- PostgreSQL
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone [URL_DEL_REPOSITORIO]
cd backend-llm
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar el archivo .env con tus configuraciones
```

4. **Configurar la base de datos**

```bash
# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev
```

5. **Iniciar el servidor**

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 🚀 Uso

### Conectarse al WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

// Enviar un prompt
socket.emit('prompt', {
  chatId: 'uuid-del-chat',
  prompt: 'Crea una publicación sobre el nuevo curso de JavaScript en la FICCT',
});

// Escuchar respuestas en tiempo real
socket.on('prompt-response', (data) => {
  console.log('Respuesta:', data.respuesta);
});
```

### API REST Endpoints

```bash
# Chats
GET    /api/chats           # Obtener todos los chats
POST   /api/chats           # Crear nuevo chat
GET    /api/chats/:id       # Obtener chat específico
PUT    /api/chats/:id       # Actualizar chat
DELETE /api/chats/:id       # Eliminar chat

# Mensajes
GET    /api/mensajes        # Obtener todos los mensajes
POST   /api/mensajes        # Crear nuevo mensaje
GET    /api/mensajes/:id    # Obtener mensaje específico

# Publicaciones
GET    /api/publicacion     # Obtener todas las publicaciones
POST   /api/publicacion     # Crear nueva publicación
```

## 🔧 Configuración Adicional

### Soporte para Ollama (Alternativa Local)

El proyecto también incluye soporte para Ollama como alternativa local a OpenAI:

```typescript
// Crear instancia de Ollama sin API key
ollama = new Ollama();

// Uso (comentado en el código actual)
const response = await this.ollama.chat({
  model: 'gpt-oss:120b-cloud',
  messages: [{ role: 'user', content: data.prompt }],
  stream: true,
});
```

### CORS Configuration

```typescript
app.enableCors({
  origin: ['http://localhost:3000'],
  credentials: true,
});
```

## 📊 Base de Datos

### Modelo de Datos

```prisma
model Chat {
  id            String        @id @default(uuid())
  nombre        String
  mensajes      Mensaje[]
  publicaciones Publicacion[]
  // ...timestamps
}

model Mensaje {
  id        String @id @default(uuid())
  contenido String
  emisor    Emisor  // USUARIO | LLM
  chatId    String
  chat      Chat   @relation(fields: [chatId], references: [id])
  // ...timestamps
}

model Publicacion {
  id         String @id @default(uuid())
  titulo     String
  link       String
  plataforma String
  chatId     String
  // ...timestamps
}
```

## 🛠️ Scripts Disponibles

```bash
npm run build          # Compilar para producción
npm run start          # Iniciar servidor
npm run start:dev      # Iniciar en modo desarrollo
npm run start:debug    # Iniciar con debugger
npm run lint           # Ejecutar linter
npm run test           # Ejecutar tests
npm run test:watch     # Tests en modo watch
npm run test:cov       # Tests con coverage
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia UNLICENSED - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🏫 Acerca del Proyecto

Este sistema fue desarrollado para la **Facultad de Ingeniería de Ciencias de la Computación (FICCT)** de la **Universidad Autónoma Gabriel René Moreno** en Santa Cruz de la Sierra, Bolivia, con el objetivo de automatizar y optimizar la creación de contenido para redes sociales institucionales.

---

**Desarrollado con ❤️ para la FICCT - UAGRM**

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
