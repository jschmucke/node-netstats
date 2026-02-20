import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NodeInfoDto {
  @IsString() @MaxLength(128) declare name: string;
  @IsString() @MaxLength(256) @IsOptional() contact?: string;
  @IsString() @IsOptional() coinbase?: string | null;
  @IsString() @IsOptional() node?: string | null;
  @IsString() @IsOptional() net?: string | null;
  @IsNumber() @IsOptional() protocol?: number | null;
  @IsString() @IsOptional() api?: string | null;
  @IsNumber() @IsOptional() port?: number;
  @IsString() @IsOptional() os?: string;
  @IsString() @IsOptional() os_v?: string;
  @IsString() @IsOptional() client?: string;
  @IsBoolean() @IsOptional() canUpdateHistory?: boolean;
  @IsInt() @IsOptional() chainId?: number;
}

export class HelloDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'id must be alphanumeric with _ or -' })
  declare id: string;

  @ValidateNested()
  @Type(() => NodeInfoDto)
  declare info: NodeInfoDto;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  declare secret: string;
}
