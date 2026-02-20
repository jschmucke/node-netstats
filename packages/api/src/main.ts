import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { NodesService } from './nodes/nodes.service';
import { ClientGateway } from './nodes/gateways/client.gateway';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<AppConfig>);
  const port = config.get<number>('port') ?? 3000;
  const nodeEnv = config.get<string>('nodeEnv') ?? 'development';
  const allowedOrigins = config.get<string[]>('allowedOrigins') ?? ['*'];

  // Security: HTTP headers
  app.use(helmet.default());

  // CORS
  app.enableCors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'HEAD'],
  });

  // Global validation pipe — strips unknown properties, applies DTO rules
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Wire charts callback: NodesService → ClientGateway broadcast
  const nodesService = app.get(NodesService);
  const clientGateway = app.get(ClientGateway);

  // Inject nodesService into clientGateway (breaks circular dep at runtime)
  clientGateway.setNodesService(nodesService);

  nodesService.setChartsCallback(charts => {
    clientGateway.broadcast('charts', charts);
  });

  await app.listen(port);
  logger.log(`eth-netstats API running on port ${port} [${nodeEnv}]`);
}

bootstrap();
