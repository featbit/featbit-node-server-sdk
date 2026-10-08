import { Operator, OperatorTypes } from "../../src/evaluation/operator";

describe('given an operator and a user without the attribute (undefined)', () => {
  const missing = undefined as unknown as string;

  // string operators used to throw here: now no match
  it.each([OperatorTypes.EndsWith, OperatorTypes.StartsWith, OperatorTypes.Contains, OperatorTypes.NotContain])(
    '%s returns false and does not throw', (op) => {
      expect(() => Operator.get(op).isMatch(missing, "x")).not.toThrow();
      expect(Operator.get(op).isMatch(missing, "x")).toBe(false);
    });

  // backward compatible: operators that already handled undefined keep their result
  it('Equal stays false', () => {
    expect(Operator.get(OperatorTypes.Equal).isMatch(missing, "x")).toBe(false);
  });

  it('NotEqual stays true', () => {
    expect(Operator.get(OperatorTypes.NotEqual).isMatch(missing, "x")).toBe(true);
  });
});
