import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodesService } from './nodes.service';
import { NetworkService } from '../network/network.service';
import type { AppConfig } from '../config/configuration';

@Controller('api')
export class NodesController {
  constructor(
    private readonly nodesService: NodesService,
    private readonly networkService: NetworkService,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  @Get('nodes')
  getNodes() {
    return { nodes: this.nodesService.all() };
  }

  @Get('charts')
  getCharts() {
    return this.nodesService.getCharts();
  }

  @Get('network')
  getNetwork() {
    return {
      profile: this.networkService.getProfile(),
      thresholds: this.networkService.getBlockTimeThresholds(),
    };
  }
}
