import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isFromBeforeTo', async: false })
export class IsFromBeforeToConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments): boolean {
    const obj = args.object as { from?: string; to?: string };
    if (!obj.from || !obj.to) return true;
    return new Date(obj.from) < new Date(obj.to);
  }

  defaultMessage(): string {
    return "The 'to' date must be after the 'from' date";
  }
}
