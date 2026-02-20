import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NodesService } from '../nodes.service';

@WebSocketGateway({ namespace: '/external', cors: true })
export class ExternalGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ExternalGateway.name);

  constructor(private readonly nodesService: NodesService) {}

  handleConnection(client: Socket): void {
    this.logger.log(`External client connected: ${client.id}`);
  }

  @SubscribeMessage('latestBlock')
  handleLatestBlock(@ConnectedSocket() client: Socket): void {
    const charts = this.nodesService.getCharts();
    const bestHeight = charts.height?.at(-1) ?? 0;
    client.emit('latestBlock', { number: bestHeight });
  }

  /** Notify external consumers of a new highest block. */
  notifyLatestBlock(number: number): void {
    this.server.emit('lastBlock', { number });
  }
}
