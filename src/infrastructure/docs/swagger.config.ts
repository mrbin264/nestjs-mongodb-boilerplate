import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export class SwaggerConfig {
  static setup(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle('Boilerplate API')
      .setDescription('NestJS Authentication and User Management API')
      .setVersion('1.0')
      .addBearerAuth()
      .addSecurity('bearer', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('profile', 'User profile endpoints')
      .addTag('health', 'Health check endpoints')
      .addServer('http://localhost:3000', 'Development server')
      .addServer('https://api.boilerplate.com', 'Production server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    
    // Setup Swagger UI
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Boilerplate API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #3c4043 }
      `,
    });

    // Export OpenAPI spec as JSON
    SwaggerModule.setup('api/docs-json', app, document);
  }
}
