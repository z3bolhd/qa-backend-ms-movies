import { NestFactory } from "@nestjs/core";

import cookieParser from "cookie-parser";

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useLogger(app.get(Logger));

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle("Movies api")
    .setDescription("This api for movies")
    .setVersion("1.02")
    .setExternalDoc("Коллекция json", "/swagger-json")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger", app, document);

  await app.listen(5000);
}
bootstrap();
