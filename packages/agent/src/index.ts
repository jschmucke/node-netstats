import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from repo root (two levels up from packages/agent)
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

import { Agent } from './agent';

const agent = new Agent();

agent.start();

process.on('SIGTERM', () => {
  console.log('[Agent] Received SIGTERM, shutting down gracefully');
  agent.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Agent] Received SIGINT, shutting down gracefully');
  agent.stop();
  process.exit(0);
});

process.on('uncaughtException', err => {
  agent.handleUncaughtError(err);
});
