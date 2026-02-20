import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NetworkProfile, BlockTimeThresholds } from '@eth-netstats/types';
import type { AppConfig } from '../config/configuration';

@Injectable()
export class NetworkService {
  private readonly profile: NetworkProfile;

  constructor(private readonly config: ConfigService<AppConfig>) {
    this.profile = this.config.get('network') as NetworkProfile;
  }

  getProfile(): NetworkProfile {
    return this.profile;
  }

  /** Dynamic thresholds for block-time color coding, derived from expectedBlockTime */
  getBlockTimeThresholds(): BlockTimeThresholds {
    const t = this.profile.expectedBlockTime;
    return {
      good: t * 1.1,
      warning: t * 1.7,
      danger: t * 2.5,
    };
  }

  /** Bin width in ms for propagation histogram */
  getBinWidth(bins = 40): number {
    return this.profile.maxPropagationMs / bins;
  }

  formatExplorerBlockUrl(blockHashOrNumber: string | number): string {
    if (!this.profile.explorerUrl) return '';
    return `${this.profile.explorerUrl}/block/${blockHashOrNumber}`;
  }

  formatExplorerAddressUrl(address: string): string {
    if (!this.profile.explorerUrl) return '';
    return `${this.profile.explorerUrl}/address/${address}`;
  }
}
