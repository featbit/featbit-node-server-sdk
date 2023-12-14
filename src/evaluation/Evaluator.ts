import Context from "../Context";
import { IFlag } from "./data/Flag";
import EvalResult from "./EvalResult";
import { Queries } from "./Queries";
import { IPlatform } from "../platform/Platform";
import { isMatchRule } from "./evalRules";
import { Regex } from "../utils/Regex";
import { DispatchAlgorithm } from "./DispatchAlgorithm";
import { IVariation } from "./data/Variation";

/**
 * @internal
 */
export default class Evaluator {
  constructor(private platform: IPlatform, private queries: Queries) {
  }

  /**
   * Evaluate the given flag against the given context.
   * @param flag The flag to evaluate.
   * @param context The context to evaluate the flag against.
   */
  evaluate(
    flagKey: string,
    context: Context,
    //eventFactory?: EventFactory,
  ): EvalResult {
    const flag = this.queries.getFlag(flagKey);
    if (!flag) {
      return EvalResult.flagNotFound(flagKey);
    }

    if (!flag.isEnabled) {
      return this.evalDisabledVariation(flag);
    }

    const targetRes = this.evalTargets(flag, context);
    if (targetRes) {
      return targetRes;
    }

    return this.evaluateRules(flag, context);
  }

  /**
   * Evaluate the targets of the specified flag against the given context.
   * @param flag The flag to evaluate targets for.
   * @param context The context to evaluate those targets against.
   * @returns An evaluation result if there is a target match/error or undefined if there is not.
   *
   * @internal
   */
  private evalTargets(flag: IFlag, context: Context): EvalResult | undefined {
    const target = flag.targetUsers.find(t => t.keyIds.indexOf(context.key()))

    if (target) {
      const targetedVariation = this.getVariation(flag, target.variationId);
      EvalResult.targeted(targetedVariation!.value);
    }

    return undefined;
  }

  /**
   * Attempt to get an evaluation result for the specific variation/flag combination.
   * @param flag The flag to get a variation from.
   * @param index The index of the flag.
   * @param reason The initial evaluation reason. If there is a valid variation, then this reason
   * will be returned in the EvalResult.
   * @returns An evaluation result containing the successful evaluation, or an error if there is
   * a problem accessing the variation.
   *
   * @internal
   */
  private getVariation(
    flag: IFlag,
    variationId: string
  ): IVariation | undefined {
    return flag.variations.find(v => v.id === variationId);
  }

  /**
   * Attempt to get an off result for the specified flag.
   * @param flag The flag to get the off variation for.
   * @param reason The initial reason for the evaluation result.
   * @returns A successful evaluation result, or an error result if there is a problem accessing
   * the off variation. Flags which do not have an off variation specified will get a `null` flag
   * value with an `undefined` variation.
   *
   * @internal
   */
  private evalDisabledVariation(flag: IFlag): EvalResult {
    const disabledVariation = this.getVariation(flag, flag.disabledVariationId);
    if (!disabledVariation) {
      return EvalResult.malformedFlag();
    }

    return EvalResult.flagOff(disabledVariation.value);
  }

  /**
   * Evaluate the rules for a flag and return an {@link EvalResult} if there is
   * a match or error.
   * @param flag The flag to evaluate rules for.
   * @param context The context to evaluate the rules against.
   * @param state The current evaluation state.
   * @param cb Callback called when rule evaluation is complete, it will be called with either
   * an {@link EvalResult} or 'undefined'.
   */
  private evaluateRules(
    flag: IFlag,
    context: Context,
  ): EvalResult {
    let dispatchKey: string;

    for(const rule of flag.rules) {
      const match = isMatchRule(this.queries, rule, context);
      if(match) {
        const ruleDispatchKey = rule.dispatchKey;
        dispatchKey = Regex.isNullOrWhiteSpace(ruleDispatchKey)
          ? `${flag.key}${context.key()}`
          : `${flag.key}${context.value(ruleDispatchKey)}`;

        const rolloutVariation = rule.variations.find(v => DispatchAlgorithm.IsInRollout(this.platform.crypto, dispatchKey, v.rollout))
        if (!rolloutVariation) {
          return EvalResult.malformedFlag();
        }

        const variation = this.getVariation(flag, rolloutVariation.id)!;

        return EvalResult.ruleMatched(variation?.value, rule.name);
      }
    }

    // match default rule
    const fallthroughDispatchKey = flag.fallthrough.dispatchKey;
    dispatchKey = Regex.isNullOrWhiteSpace(fallthroughDispatchKey)
      ? `${flag.key}${context.key()}`
      : `${flag.key}${context.value(fallthroughDispatchKey)}`;

    const defaultVariation = flag.fallthrough.variations.find(v => DispatchAlgorithm.IsInRollout(this.platform.crypto, dispatchKey, v.rollout));
    if (!defaultVariation) {
      return EvalResult.malformedFlag();
    }

    const variation = this.getVariation(flag, defaultVariation.id)!;

    return EvalResult.fallthrough(variation.value);
  }
}