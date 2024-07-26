import { NestFactory } from "@nestjs/core";

import cookieParser from "cookie-parser";

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const HOST = configService.get<string>("HOST_MOVIES_URL");

  app.useLogger(app.get(Logger));

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle("Movies API")
    .setDescription("This API for movies")
    .setVersion("1.06.2")
    .addServer(HOST, "API server")
    .setExternalDoc("Коллекция json", HOST + "/swagger-json")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger", app, document);

  await app.listen(5000);
}
bootstrap();
