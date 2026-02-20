import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
  IsNumber,
  Min,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlockDataDto } from './block.dto';

export class SyncStatusDto {
  @IsNumber() declare startingBlock: number;
  @IsNumber() declare currentBlock: number;
  @IsNumber() declare highestBlock: number;
  @IsNumber() @Min(0) declare progress: number;
}

export class NodeStatsDto {
  @IsBoolean() declare active: boolean;
  @IsBoolean() declare mining: boolean;
  @IsNumber() @Min(0) declare hashrate: number;
  @IsNumber() @Min(0) declare peers: number;
  @IsNumber() @Min(0) @IsOptional() pending?: number;
  @IsString() declare gasPrice: string;
  @ValidateNested() @Type(() => BlockDataDto) @IsOptional() block?: BlockDataDto;
  @IsBoolean() @IsOptional() syncing?: boolean;
  @IsNumber() @Min(0) @IsOptional() uptime?: number;
}

export class StatsPayloadDto {
  @IsString() @IsNotEmpty() @MaxLength(64) declare id: string;
  @ValidateNested() @Type(() => NodeStatsDto) declare stats: NodeStatsDto;
}

export class PendingStatsDto {
  @IsNumber() @Min(0) declare pending: number;
}

export class PendingPayloadDto {
  @IsString() @IsNotEmpty() @MaxLength(64) declare id: string;
  @ValidateNested() @Type(() => PendingStatsDto) declare stats: PendingStatsDto;
}

export class LatencyPayloadDto {
  @IsString() @IsNotEmpty() @MaxLength(64) declare id: string;
  @IsNumber() @Min(0) declare latency: number;
}

export class NodePingPayloadDto {
  @IsString() @IsNotEmpty() @MaxLength(64) declare id: string;
  @IsNumber() declare clientTime: number;
}
