import {
  IsISO8601,
  IsInt,
  IsOptional,
  Max,
  Min,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsFromBeforeToConstraint } from '../../common/validators/is-from-before-to.validator';

export class HeartRateEventsQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  @Validate(IsFromBeforeToConstraint)
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
