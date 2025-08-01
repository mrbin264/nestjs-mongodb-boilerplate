import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './modules/app.module';
import { SwaggerConfig } from './infrastructure/docs/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = configService.get<number>('app.port') || 3000;
  const appName = configService.get<string>('app.name');
  const nodeEnv = configService.get<string>('app.nodeEnv');

  // Setup Swagger documentation
  if (nodeEnv !== 'production') {
    SwaggerConfig.setup(app);
  }

  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`🚀 ${appName} is running on: http://localhost:${port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
  // eslint-disable-next-line no-console
  console.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
  // eslint-disable-next-line no-console
  console.log(`🌍 Environment: ${nodeEnv}`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Error starting the application:', error);
  process.exit(1);
});
