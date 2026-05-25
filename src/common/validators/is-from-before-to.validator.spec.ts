import { IsFromBeforeToConstraint } from './is-from-before-to.validator';
import { ValidationArguments } from 'class-validator';

function makeArgs(from?: string, to?: string): ValidationArguments {
  return { object: { from, to } } as ValidationArguments;
}

describe('IsFromBeforeToConstraint', () => {
  const constraint = new IsFromBeforeToConstraint();

  it('returns true when from is before to', () => {
    expect(
      constraint.validate(
        null,
        makeArgs('2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z'),
      ),
    ).toBe(true);
  });

  it('returns false when from equals to', () => {
    expect(
      constraint.validate(
        null,
        makeArgs('2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
      ),
    ).toBe(false);
  });

  it('returns false when from is after to', () => {
    expect(
      constraint.validate(
        null,
        makeArgs('2024-01-02T00:00:00Z', '2024-01-01T00:00:00Z'),
      ),
    ).toBe(false);
  });

  it('returns true when from is absent', () => {
    expect(
      constraint.validate(null, makeArgs(undefined, '2024-01-01T00:00:00Z')),
    ).toBe(true);
  });

  it('returns true when to is absent', () => {
    expect(
      constraint.validate(null, makeArgs('2024-01-01T00:00:00Z', undefined)),
    ).toBe(true);
  });
});
