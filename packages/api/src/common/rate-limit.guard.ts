import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import type { Socket } from 'socket.io';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly events = new Map<string, { count: number; resetAt: number }>();
  private readonly MAX_EVENTS = 300;
  private readonly WINDOW_MS = 60_000;

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const ip = client.handshake.address ?? 'unknown';
    const now = Date.now();

    let entry = this.events.get(ip);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.WINDOW_MS };
    }
    entry.count++;
    this.events.set(ip, entry);

    if (entry.count > this.MAX_EVENTS) {
      this.logger.warn(`Rate limit exceeded for IP ${ip} (${entry.count} events/min)`);
      return false;
    }
    return true;
  }
}
