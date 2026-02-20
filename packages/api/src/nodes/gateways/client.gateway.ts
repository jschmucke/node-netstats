import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NodesService } from '../nodes.service';

const CLIENT_PING_INTERVAL_MS = 5_000;
const NODE_REFRESH_INTERVAL_MS = 60 * 60 * 1_000; // 1 hour

@WebSocketGateway({ namespace: '/primus', cors: true })
export class ClientGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ClientGateway.name);
  private nodesService!: NodesService;

  /**
   * NodesService is wired post-construction via setNodesService()
   * to avoid circular injection (ClientGateway ← AgentGateway → NodesService → ClientGateway).
   */
  setNodesService(nodesService: NodesService): void {
    this.nodesService = nodesService;
    this.startIntervals();
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Browser connected: ${client.id}`);
  }

  @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() client: Socket): void {
    const nodes = this.nodesService.all();
    client.emit('init', { nodes });
    this.nodesService.scheduleCharts();
  }

  @SubscribeMessage('client-pong')
  handleClientPong(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { serverTime?: number },
  ): void {
    const serverTime = data?.serverTime ?? 0;
    const latency = Math.ceil((Date.now() - serverTime) / 2);
    client.emit('client-latency', { latency });
  }

  /** Broadcast a message to all connected browser clients. */
  broadcast(event: string, data: unknown): void {
    this.server.emit(event, data);
  }

  private startIntervals(): void {
    // client-ping every 5 seconds for latency measurement
    setInterval(() => {
      this.server.emit('client-ping', { serverTime: Date.now() });
    }, CLIENT_PING_INTERVAL_MS);

    // Full node list refresh every hour (cleans stale nodes from browser)
    setInterval(() => {
      const nodes = this.nodesService.all();
      this.server.emit('init', { nodes });
      this.nodesService.scheduleCharts();
    }, NODE_REFRESH_INTERVAL_MS);
  }
}
