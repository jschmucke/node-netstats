import { Module } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';
import { HistoryService } from './history.service';
import { AgentGateway } from './gateways/agent.gateway';
import { ClientGateway } from './gateways/client.gateway';
import { ExternalGateway } from './gateways/external.gateway';
import { GeoModule } from '../geo/geo.module';
import { NetworkModule } from '../network/network.module';
import { RateLimitGuard } from '../common/rate-limit.guard';

@Module({
  imports: [GeoModule, NetworkModule],
  controllers: [NodesController],
  providers: [NodesService, HistoryService, AgentGateway, ClientGateway, ExternalGateway, RateLimitGuard],
  exports: [NodesService, ClientGateway],
})
export class NodesModule {}
