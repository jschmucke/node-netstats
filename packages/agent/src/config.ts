import * as os from 'os';

function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, c => c.toLowerCase());
}

const instanceName =
  process.env.INSTANCE_NAME ||
  process.env.EC2_INSTANCE_ID ||
  os.hostname();

export const config = {
  instanceName,
  id: camelCase(instanceName),
  contact: process.env.CONTACT_DETAILS ?? '',
  listeningPort: parseInt(process.env.LISTENING_PORT ?? '30303', 10),
  wsServer: process.env.WS_SERVER ?? 'http://localhost:3000',
  wsSecret: process.env.WS_SECRET ?? 'eth-net-stats-has-a-secret',
  rpcUrl: process.env.RPC_URL ?? `http://${process.env.RPC_HOST ?? 'localhost'}:${process.env.RPC_PORT ?? '8545'}`,
  verbosity: parseInt(process.env.VERBOSITY ?? '2', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  nodeConsensus: process.env.NETWORK_CONSENSUS ?? 'pow',
} as const;

if (config.nodeEnv === 'production' && !process.env.INSTANCE_NAME) {
  console.error('INSTANCE_NAME is required in production');
  process.exit(1);
}
