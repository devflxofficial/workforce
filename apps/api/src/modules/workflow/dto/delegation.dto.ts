import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsISO8601, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDelegationDto {
  @ApiProperty()
  @IsString()
  delegatorUserId!: string;

  @ApiProperty()
  @IsString()
  delegateUserId!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  requestTypes!: string[];

  @ApiProperty()
  @IsISO8601()
  startsAt!: string;

  @ApiProperty()
  @IsISO8601()
  endsAt!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  scope?: Record<string, unknown>;
}
