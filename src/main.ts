import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend development
  app.enableCors({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true,
  });

  // Global exception filter for standardized error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe for all incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties sent
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert primitives based on TS type
      },
    }),
  );

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('EasyTax-AU API')
    .setDescription(
      'Local-first tax management API for Australian sole traders. ' +
        'Manages expenses, incomes, and BAS (Business Activity Statement) reporting.',
    )
    .setVersion('1.0')
    .addTag('categories', 'Expense categories (e.g., Hosting, Software, Internet)')
    .addTag('providers', 'Expense providers with GST rules (e.g., VentraIP, GitHub)')
    .addTag('clients', 'Income clients (encrypted)')
    .addTag('expenses', 'Business expenses with GST tracking')
    .addTag('incomes', 'Business income/invoices')
    .addTag('bas', 'BAS (Business Activity Statement) reporting')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // HOST=127.0.0.1 keeps the API reachable only through a reverse proxy on the
  // same host; the 0.0.0.0 default is what the Docker port mapping needs.
  await app.listen(process.env.PORT ?? 3000, process.env.HOST ?? '0.0.0.0');
}

void bootstrap();
