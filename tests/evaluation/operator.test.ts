import { Operator, OperatorTypes } from "../../src/evaluation/operator";

const operators = [...Object.values(OperatorTypes), 'UnknownOperator'];

describe.each([undefined, null])('given a nullish value (%s)', missing => {
  it.each(operators)('%s does not match a missing user value', op => {
    expect(Operator.get(op).isMatch(missing, 'x')).toBe(false);
  });

  it.each(operators)('%s does not match a missing condition value', op => {
    expect(Operator.get(op).isMatch('x', missing)).toBe(false);
  });

  it.each(operators)('%s does not match when both values are missing', op => {
    expect(Operator.get(op).isMatch(missing, missing)).toBe(false);
  });
});

describe('empty strings are compared normally', () => {
  it.each([
    [OperatorTypes.Equal, true],
    [OperatorTypes.NotEqual, false],
    [OperatorTypes.Contains, true],
    [OperatorTypes.NotContain, false],
    [OperatorTypes.StartsWith, true],
    [OperatorTypes.EndsWith, true],
  ] as const)('%s returns %s', (op, expected) => {
    expect(Operator.get(op).isMatch('', '')).toBe(expected);
  });
});
