import { IsISO8601, Validate } from 'class-validator';
import { IsFromBeforeToConstraint } from '../../common/validators/is-from-before-to.validator';

export class AnalyticsRangeQueryDto {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  @Validate(IsFromBeforeToConstraint)
  to!: string;
}
