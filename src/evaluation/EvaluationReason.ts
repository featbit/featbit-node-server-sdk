/**
 * Describes the reason that a flag evaluation produced a particular value. This is
 * part of the {@link LDEvaluationDetail} object returned by `LDClient.variationDetail`.
 */
export interface EvaluationReason {
  /**
   * The general category of the reason:
   *
   * - `'OFF'`: The flag was off and therefore returned its configured off value.
   * - `'FALLTHROUGH'`: The flag was on but the context did not match any targets or rules.
   * - `'TARGET_MATCH'`: The context key was specifically targeted for this flag.
   * - `'RULE_MATCH'`: the context matched one of the flag's rules.
   * - `'PREREQUISITE_FAILED'`: The flag was considered off because it had at least one
   *   prerequisite flag that either was off or did not return the desired variation.
   * - `'ERROR'`: The flag could not be evaluated, e.g. because it does not exist or due
   *   to an unexpected error.
   */
  kind: string;

  /**
   * The unique identifier of the matched rule, if the kind was `'RULE_MATCH'`.
   */
  ruleId?: string;
}