import * as Joi from 'joi';
import type { NetworkProfile } from '@eth-netstats/types';
import { KNOWN_NETWORKS, DEFAULT_NETWORK } from './networks';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  wsSecrets: string[];
  allowedOrigins: string[];
  trustedIps: string[];
  bannedIps: string[];
  network: NetworkProfile;
}

function loadWsSecrets(): string[] {
  if (process.env.WS_SECRET) {
    return process.env.WS_SECRET.split('|').filter(Boolean);
  }
  // In production, refuse to start without WS_SECRET (enforced by Joi schema)
  return [];
}

function resolveNetwork(): NetworkProfile {
  const chainId = process.env.NETWORK_CHAIN_ID
    ? parseInt(process.env.NETWORK_CHAIN_ID, 10)
    : undefined;

  if (chainId !== undefined) {
    if (KNOWN_NETWORKS[chainId]) return KNOWN_NETWORKS[chainId];

    // Custom/private network via NETWORK_* env vars
    return {
      chainId,
      name: process.env.NETWORK_NAME ?? `Chain ${chainId}`,
      shortName: process.env.NETWORK_SHORT_NAME ?? 'ETH',
      nativeSymbol: process.env.NETWORK_NATIVE_SYMBOL ?? 'ETH',
      expectedBlockTime: parseInt(process.env.NETWORK_EXPECTED_BLOCK_TIME ?? '12000', 10),
      consensus: (process.env.NETWORK_CONSENSUS ?? 'pos') as 'pow' | 'pos' | 'poa',
      explorerUrl: process.env.NETWORK_EXPLORER_URL ?? '',
      maxPropagationMs: parseInt(process.env.NETWORK_MAX_PROPAGATION_MS ?? '10000', 10),
    };
  }

  return DEFAULT_NETWORK;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  wsSecrets: loadWsSecrets(),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '*').split(',').filter(Boolean),
  trustedIps: (process.env.TRUSTED_IPS ?? '::ffff:127.0.0.1,127.0.0.1')
    .split(',')
    .filter(Boolean),
  bannedIps: (process.env.BANNED_IPS ?? '').split(',').filter(Boolean),
  network: resolveNetwork(),
});

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  WS_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().default('dev-secret-change-me'),
  }),
  ALLOWED_ORIGINS: Joi.string().optional(),
  TRUSTED_IPS: Joi.string().optional(),
  BANNED_IPS: Joi.string().optional(),
  NETWORK_CHAIN_ID: Joi.number().integer().optional(),
  NETWORK_NAME: Joi.string().optional(),
  NETWORK_SHORT_NAME: Joi.string().optional(),
  NETWORK_NATIVE_SYMBOL: Joi.string().optional(),
  NETWORK_EXPECTED_BLOCK_TIME: Joi.number().integer().min(100).optional(),
  NETWORK_CONSENSUS: Joi.string().valid('pow', 'pos', 'poa').optional(),
  NETWORK_EXPLORER_URL: Joi.string().uri().optional().allow(''),
  NETWORK_MAX_PROPAGATION_MS: Joi.number().integer().min(500).optional(),
});
