import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMaxSize,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BlockDataDto {
  @IsInt() @Min(0) @Max(Number.MAX_SAFE_INTEGER) declare number: number;
  @IsString() @MaxLength(66) declare hash: string;
  @IsString() @MaxLength(66) @IsOptional() parentHash?: string;
  @IsString() @MaxLength(66) @IsOptional() sha3Uncles?: string;
  @IsString() @MaxLength(66) @IsOptional() transactionsRoot?: string;
  @IsString() @MaxLength(66) @IsOptional() stateRoot?: string;
  @IsString() @MaxLength(42) @IsOptional() miner?: string;
  @IsString() declare difficulty: string;
  @IsString() @IsOptional() totalDifficulty?: string;
  @IsNumber() @Min(0) declare gasLimit: number;
  @IsNumber() @Min(0) @IsOptional() gasUsed?: number;
  @IsNumber() @Min(0) declare timestamp: number;
  @IsArray() @ArrayMaxSize(500) @IsOptional() transactions?: string[];
  @IsArray() @ArrayMaxSize(10) @IsOptional() uncles?: string[];
}

export class BlockPayloadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  declare id: string;

  @ValidateNested()
  @Type(() => BlockDataDto)
  declare block: BlockDataDto;
}
