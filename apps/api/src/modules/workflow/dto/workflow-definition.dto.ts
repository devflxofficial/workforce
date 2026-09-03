import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class WorkflowStageDto {
  @ApiProperty()
  @IsInt()
  sequenceNo!: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  stageName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalMode?: string;

  @ApiProperty()
  @IsString()
  approverSource!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  minimumApprovals?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  dueAfterMinutes?: number;
}

export class CreateWorkflowDefinitionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: 'LEAVE' })
  @IsString()
  requestType!: string;

  @ApiProperty({ type: [WorkflowStageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStageDto)
  stages!: WorkflowStageDto[];
}
