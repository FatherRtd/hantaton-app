import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response } from 'express';
// import { setGlobalDispatcher, Agent } from 'undici';
//
// setGlobalDispatcher(new Agent({ connect: { timeout: 6000_000 } }));

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  app.useStaticAssets(join(__dirname, '..', 'static'), {
    index: false,
    prefix: '/',
  });

  app.use((req: Request, res: Response, next: Function) => {
    if (!req.originalUrl.startsWith('/api') && !req.originalUrl.includes('.')) {
      res.sendFile(join(__dirname, '..', 'static', 'index.html'));
    } else {
      next();
    }
  });

  await app.listen(process.env.PORT ?? 3011);
}

bootstrap();
