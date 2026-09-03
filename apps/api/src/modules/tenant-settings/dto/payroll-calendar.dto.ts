import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, MaxLength, MinLength, Min } from 'class-validator';

export class CreatePayrollGroupDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;
}

export class CreatePayrollCalendarDto {
  @ApiProperty()
  @IsString()
  payrollGroupId!: string;

  @ApiProperty()
  @IsInt()
  @Min(2000)
  calendarYear!: number;
}

export class CreatePayrollPeriodDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  periodCode!: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  periodStart!: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  periodEnd!: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  paymentDate!: string;

  @ApiProperty()
  @IsString()
  attendanceCutoffAt!: string;

  @ApiProperty()
  @IsString()
  adjustmentCutoffAt!: string;
}
