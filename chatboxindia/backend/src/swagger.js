import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ChatBoxIndia API',
      version: '1.0.0',
      description: 'REST API for ChatBoxIndia MVP backend'
    },
    servers: [
      {
        url: 'http://localhost:8090',
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'naresh@chatboxindia.app' },
            password: { type: 'string', example: 'demo123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                avatar: { type: 'string' },
                about: { type: 'string' }
              }
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            senderId: { type: 'string' },
            text: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            status: { type: 'string', example: 'sent' }
          }
        },
        SendMessageRequest: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', example: 'Hello from ChatBoxIndia' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/server.js']
};

const spec = swaggerJsdoc(options);

export function registerSwagger(app) {
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(spec));
  app.get('/openapi.json', (_, res) => res.json(spec));
}
