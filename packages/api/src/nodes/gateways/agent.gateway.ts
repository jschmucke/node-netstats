import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards, UsePipes, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { AppConfig } from '../../config/configuration';
import { XssPipe } from '../../common/xss.pipe';
import { RateLimitGuard } from '../../common/rate-limit.guard';
import { NodesService } from '../nodes.service';
import { ClientGateway } from './client.gateway';
import { HelloDto } from '../dto/hello.dto';
import { BlockPayloadDto } from '../dto/block.dto';
import { StatsPayloadDto, PendingPayloadDto, LatencyPayloadDto, NodePingPayloadDto } from '../dto/stats.dto';

@WebSocketGateway({ namespace: '/api', cors: true })
@UseGuards(RateLimitGuard)
@UsePipes(new XssPipe())
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(AgentGateway.name);

  constructor(
    private readonly nodesService: NodesService,
    private readonly clientGateway: ClientGateway,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  handleConnection(client: Socket): void {
    const ip = this.getIp(client);
    const bannedIps = this.config.get<string[]>('bannedIps') ?? [];
    if (bannedIps.includes(ip)) {
      this.logger.warn(`Banned IP attempted connection: ${ip}`);
      client.disconnect(true);
      return;
    }
    this.logger.log(`Agent connected: ${client.id} from ${ip}`);
  }

  handleDisconnect(client: Socket): void {
    const stats = this.nodesService.markInactive(client.id);
    if (stats) {
      this.clientGateway.broadcast('inactive', stats);
      this.logger.log(`Agent disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('hello')
  async handleHello(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ): Promise<void> {
    const dto = plainToInstance(HelloDto, raw);
    const errors = await validate(dto);
    if (errors.length > 0) {
      this.logger.warn(`hello validation failed from ${client.id}`);
      client.disconnect(true);
      return;
    }

    const wsSecrets = this.config.get<string[]>('wsSecrets') ?? [];
    if (!wsSecrets.includes(dto.secret)) {
      this.logger.warn(`Wrong secret from agent ${client.id}`);
      client.disconnect(true);
      return;
    }

    const ip = this.getIp(client);
    const info = this.nodesService.addNode({
      id: dto.id,
      info: dto.info,
      spark: client.id,
      ip,
      latency: 0,
    });

    if (info) {
      client.emit('ready');
      this.clientGateway.broadcast('add', info);
      this.logger.log(`Agent hello accepted: ${dto.id}`);
    }
  }

  @SubscribeMessage('block')
  async handleBlock(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ): Promise<void> {
    const dto = plainToInstance(BlockPayloadDto, raw);
    const errors = await validate(dto);
    if (errors.length > 0) {
      this.logger.warn(`block validation failed from ${client.id}`);
      return;
    }

    const stats = this.nodesService.addBlock(dto.id, dto.block as any);
    if (stats) {
      this.clientGateway.broadcast('block', stats);
      this.nodesService.scheduleCharts();
      this.logger.debug(`Block ${dto.block.number} from ${dto.id}`);
    }
  }

  @SubscribeMessage('update')
  async handleUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ): Promise<void> {
    const dto = plainToInstance(StatsPayloadDto, raw);
    const errors = await validate(dto);
    if (errors.length > 0) {
      this.logger.warn(`update validation failed from ${client.id}`);
      return;
    }

    const stats = this.nodesService.updateNode(dto.id, dto.stats as any);
    if (stats) {
      this.clientGateway.broadcast('update', stats);
      this.nodesService.scheduleCharts();
    }
  }

  @SubscribeMessage('stats')
  async handleStats(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ): Promise<void> {
    const dto = plainToInstance(StatsPayloadDto, raw);
    const errors = await validate(dto);
    if (errors.length > 0) {
      this.logger.warn(`stats validation failed from ${client.id}`);
      return;
    }

    const result = this.nodesService.updateStats(dto.id, dto.stats as any);
    if (result) {
      this.clientGateway.broadcast('stats', result);
      this.nodesService.scheduleCharts();
    }
  }

  @SubscribeMessage('pending')
  async handlePending(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ): Promise<void> {
    const dto = plainToInstance(PendingPayloadDto, raw);
    const errors = await validate(dto);
    if (errors.length > 0) return;

    const result = this.nodesService.updatePending(dto.id, dto.stats.pending);
    if (result) {
      this.clientGateway.broadcast('pending', result);
    }
  }

  @SubscribeMessage('history')
  async handleHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ): Promise<void> {
    if (!raw || typeof raw !== 'object') return;
    const data = raw as { id?: string; history?: unknown[] };
    if (!data.id || !Array.isArray(data.history)) return;

    this.logger.log(`History from ${data.id}: ${data.history.length} blocks`);
    this.nodesService.addHistory(data.id, data.history as any);
    const charts = this.nodesService.getCharts();
    this.clientGateway.broadcast('charts', charts);
  }

  @SubscribeMessage('node-ping')
  handleNodePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ): void {
    const dto = plainToInstance(NodePingPayloadDto, raw);
    client.emit('node-pong', {
      clientTime: dto.clientTime ?? null,
      serverTime: Date.now(),
    });
  }

  @SubscribeMessage('latency')
  async handleLatency(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ): Promise<void> {
    const dto = plainToInstance(LatencyPayloadDto, raw);
    const errors = await validate(dto);
    if (errors.length > 0) return;

    this.nodesService.updateLatency(dto.id, dto.latency);

    if (this.nodesService.requiresUpdate(dto.id)) {
      const range = this.nodesService.getHistoryRequestRange();
      if (range) {
        client.emit('history', range);
        this.nodesService.askedForHistory(true);
        this.logger.log(`Requested history from ${dto.id}: ${range.min}-${range.max}`);
      }
    }
  }

  private getIp(client: Socket): string {
    const forwarded = client.handshake.headers['x-forwarded-for'];
    if (forwarded) {
      return (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]).trim();
    }
    return client.handshake.address ?? '';
  }
}
