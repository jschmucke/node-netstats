import { Injectable } from '@nestjs/common';
import * as geoip from 'geoip-lite';
import type { GeoInfo } from '@eth-netstats/types';

@Injectable()
export class GeoService {
  lookup(ip: string): GeoInfo | null {
    return geoip.lookup(ip) as GeoInfo | null;
  }
}
