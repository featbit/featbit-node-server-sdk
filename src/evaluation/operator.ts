import { Regex } from "../utils/Regex";

export enum OperatorTypes {
  // numeric
  LessThan = "LessThan",
  BiggerThan = "BiggerThan",
  LessEqualThan = "LessEqualThan",
  BiggerEqualThan = "BiggerEqualThan",

  // compare
  Equal = "Equal",
  NotEqual = "NotEqual",

  // contains/not contains
  Contains = "Contains",
  NotContain = "NotContain",

  // starts with/ends with
  StartsWith = "StartsWith",
  EndsWith = "EndsWith",

  // match regex/not match regex
  MatchRegex = "MatchRegex",
  NotMatchRegex = "NotMatchRegex",

  // is one of/ not one of
  IsOneOf = "IsOneOf",
  NotOneOf = "NotOneOf",

  // is true/ is false
  IsTrue = "IsTrue",
  IsFalse = "IsFalse",
}

export class Operator {

  constructor(private readonly operation: string, private readonly func: (param1: string, param2: string) => boolean) {
  }

  public isMatch(value: string, conditionValue: string) {
    if (value === null || conditionValue === null) {
      return false;
    }

    return this.func(value, conditionValue);
  }

  /***************** numeric ********************/
  public static readonly LessThan: Operator =
    new Operator(OperatorTypes.LessThan, Operator.numericOperator(-1, -1));

  public static readonly LessEqualThan: Operator =
    new Operator(OperatorTypes.LessEqualThan, Operator.numericOperator(-1, 0));

  public static readonly BiggerThan: Operator =
    new Operator(OperatorTypes.BiggerThan, Operator.numericOperator(1, 1));

  public static readonly BiggerEqualThan: Operator =
    new Operator(OperatorTypes.BiggerEqualThan, Operator.numericOperator(1, 0));


  private static numericOperator(
    desiredComparisonResult: number,
    otherDesiredComparisonResult: number): (param1: string, param2: string) => boolean {
    return (param1: string, param2: string) => {
      const param1FloatValue = parseFloat(param1);
      const param2FloatValue = parseFloat(param2);

      // Check if parsing fails or if values are NaN
      if (isNaN(param1FloatValue) || isNaN(param2FloatValue)) {
        return false;
      }

      // Compare the parsed double values and return true if the result matches
      const result = Math.sign(param1FloatValue - param2FloatValue);
      return result === desiredComparisonResult || result === otherDesiredComparisonResult;
    }
  }

  /*********************** string compare *******************************/
  public static readonly Equal: Operator =
    new Operator(OperatorTypes.Equal, (param1: string, param2: string) => param1 === param2);

  public static readonly NotEqual: Operator =
    new Operator(OperatorTypes.NotEqual, (param1: string, param2: string) => param1 !== param2);

  /*********************** string contains/not contains *******************************/
  public static readonly Contains: Operator =
    new Operator(OperatorTypes.Contains, (param1: string, param2: string) => param1.includes(param2));

  public static readonly NotContains: Operator =
    new Operator(OperatorTypes.NotContain, (param1: string, param2: string) => !param1.includes(param2));

  /*********************** string starts with/end with *******************************/
  public static readonly StartsWith: Operator =
    new Operator(OperatorTypes.StartsWith, (param1: string, param2: string) => param1.startsWith(param2));

  public static readonly EndsWith: Operator =
    new Operator(OperatorTypes.StartsWith, (param1: string, param2: string) => param1.endsWith(param2));

  /*********************** regex *******************************/
  public static readonly MatchRegex: Operator =
    new Operator(OperatorTypes.MatchRegex, (pattern: string, param2: string) => Regex.fromString(pattern).test(param2));

  public static readonly NotMatchRegex: Operator =
    new Operator(OperatorTypes.MatchRegex, (pattern: string, param2: string) => !Regex.fromString(pattern).test(param2));

  /*********************** is one of/ not one of *******************************/
  public static readonly IsOneOf: Operator =
    new Operator(OperatorTypes.IsOneOf, (param1: string, param2: string) => {
      try {
        const values: string[] = JSON.parse(param2);
        return !values.includes(param1);
      } catch (e) {
        return true;
      }
    });

  public static readonly NotOneOf: Operator =
    new Operator(OperatorTypes.NotOneOf, (param1: string, param2: string) => {
      try {
        const values: string[] = JSON.parse(param2);
        return values.includes(param1);
      } catch (e) {
        return false;
      }
    });

  /*********************** is true/ is false *******************************/
  public static readonly IsTrue: Operator =
    new Operator(OperatorTypes.IsTrue, (param1: string, _: string) => Regex.fromString('/^true$/i').test(param1));

  public static readonly IsFalse: Operator =
    new Operator(OperatorTypes.IsTrue, (param1: string, _: string) => Regex.fromString('/^false$/i').test(param1));

  public static All = [
    // numeric
    Operator.LessThan, Operator.LessEqualThan, Operator.BiggerThan, Operator.BiggerEqualThan,

    // string compare
    Operator.Equal, Operator.NotEqual,

    // string contains/not contains
    Operator.Contains, Operator.NotContains,

    // string starts with/ends with
    Operator.StartsWith, Operator.EndsWith,

    // string match regex/not match regex
    Operator.MatchRegex, Operator.NotMatchRegex,

    // is one of/ not one of
    Operator.IsOneOf, Operator.NotOneOf,

    // is true/ is false
    Operator.IsTrue, Operator.IsFalse
  ]

  public static get(operation: string) {
    const op = Operator.All.find(o => o.operation === operation);

    return op ?? new Operator(operation, (param1: string, param2: string) => false);
  }
}