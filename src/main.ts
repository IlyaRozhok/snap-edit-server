import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const PORT = process.env.APP_PORT ?? 3000;
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api', { exclude: ['docs', 'docs-json', 'health'] });

  const swaggerUser = process.env.SWAGGER_USER ?? 'admin';
  const swaggerPass = process.env.SWAGGER_PASS ?? 'admin';
  app.use('/docs', basicAuth({ users: { [swaggerUser]: swaggerPass }, challenge: true }));
  app.use('/docs-json', basicAuth({ users: { [swaggerUser]: swaggerPass }, challenge: true }));

  const config = new DocumentBuilder()
    .setTitle('Snap Edit API')
    .setDescription('Image editing API with Google/Apple auth')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(PORT);
  console.log(`Server running on PORT: ${PORT}`);
}
bootstrap();
