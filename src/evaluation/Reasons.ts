import { EvaluationReason } from "./EvaluationReason";

/**
 * A set of static evaluation reasons and methods for creating specific reason instances.
 *
 * @internal
 */
export default class Reasons {
  static readonly Fallthrough: EvaluationReason = { kind: 'FALLTHROUGH' };

  static readonly Off: EvaluationReason = { kind: 'OFF' };

  static ruleMatch(ruleId: string): EvaluationReason {
    return { kind: 'RULE_MATCH', ruleId };
  }

  static readonly TargetMatch: EvaluationReason = { kind: 'TARGET_MATCH' };
}