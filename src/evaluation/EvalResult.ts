import { ReasonKinds } from "./ReasonKinds";
import { EmptyString } from "../constants";

/**
 * A class which encapsulates the result of an evaluation. It allows for differentiating between
 * successful and error result types.
 *
 * @internal
 */
export default class EvalResult {
  protected constructor(
    public kind: ReasonKinds,
    public value: string,
    public reason?: string,
  ) {
  }

  static userNotSpecified() {
    return new EvalResult(ReasonKinds.Error, EmptyString, 'user not specified');
  }

  static flagNotFound(flagKey: string) {
    return new EvalResult(ReasonKinds.Error, EmptyString, `flag not found`);
  }

  static malformedFlag() {
    return new EvalResult(ReasonKinds.Error, EmptyString, 'malformed flag');
  }

  static flagOff(val: string) {
    return new EvalResult(ReasonKinds.Off, val, 'flag off');
  }

  static targeted(val: string) {
    return new EvalResult(ReasonKinds.TargetMatch, val, 'target match');
  }

  static ruleMatched(val: string, ruleName: string) {
    return new EvalResult(ReasonKinds.RuleMatch, val, `match rule ${ ruleName }`);
  }

  static fallthrough(val: string) {
    return new EvalResult(ReasonKinds.FallThrough, val, `fall through targets and rules`);
  }
}