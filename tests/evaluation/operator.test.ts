import { Operator, OperatorTypes } from "../../src/evaluation/operator";

describe('given a string operator and a user without the attribute', () => {
  // a missing user property is undefined, not null: the operator must answer "no match", not throw
  const stringOps = [OperatorTypes.EndsWith, OperatorTypes.StartsWith, OperatorTypes.Contains, OperatorTypes.Equal];

  it.each(stringOps)('%s returns false for an undefined value', (op) => {
    expect(() => Operator.get(op).isMatch(undefined as unknown as string, "x")).not.toThrow();
    expect(Operator.get(op).isMatch(undefined as unknown as string, "x")).toBe(false);
  });
});
