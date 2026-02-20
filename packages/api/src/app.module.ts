import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration, { validationSchema } from './config/configuration';
import { GeoModule } from './geo/geo.module';
import { NetworkModule } from './network/network.module';
import { NodesModule } from './nodes/nodes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env', '../../.env'],
    }),
    GeoModule,
    NetworkModule,
    NodesModule,
  ],
})
export class AppModule {}
