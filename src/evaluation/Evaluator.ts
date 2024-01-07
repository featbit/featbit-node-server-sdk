import Context from "../Context";
import { IFlag } from "./data/IFlag";
import EvalResult from "./EvalResult";
import { IPlatform } from "../platform/IPlatform";
import { isMatchRule } from "./evalRules";
import { Regex } from "../utils/Regex";
import { DispatchAlgorithm } from "./DispatchAlgorithm";
import { IVariation } from "./data/IVariation";
import { IStore } from "../store/store";
import DataKinds from "../store/DataKinds";
import { EvalEvent } from "../events/event";
import { IRolloutVariation } from "./data/IRolloutVariation";

/**
 * @internal
 */
export default class Evaluator {
  constructor(private platform: IPlatform, private store: IStore) {
  }

  /**
   * Evaluate the given flag against the given context.
   * @param flagKey The key of the feature flag.
   * @param context The context to evaluate the flag against.
   */
  evaluate(
    flagKey: string,
    context: Context
  ): [EvalResult, EvalEvent | null] {
    const flag = this.store.get(DataKinds.Flags, flagKey) as IFlag;
    if (!flag) {
      return [EvalResult.flagNotFound(flagKey), null];
    }

    if (!flag.isEnabled) {
      return this.evalDisabledVariation(flag, context);
    }

    const [targetRes, evalEvent] = this.evalTargets(flag, context);
    if (targetRes) {
      return [targetRes, evalEvent];
    }

    return this.evaluateRules(flag, context);
  }

  private evalTargets(flag: IFlag, context: Context): [EvalResult | null, EvalEvent | null] {
    const target = flag.targetUsers.find(t => t.keyIds.includes(context.key))

    if (target) {
      const targetedVariation = flag.variations.find(v => v.id === target.variationId);
      return [EvalResult.targeted(targetedVariation!.value), new EvalEvent(context.user, flag.key, targetedVariation!, flag.exptIncludeAllTargets)];
    }

    return [null, null];
  }

  private evalDisabledVariation(flag: IFlag, context: Context): [EvalResult, EvalEvent | null] {
    const disabledVariation = flag.variations.find(v => v.id === flag.disabledVariationId);
    if (!disabledVariation) {
      return this.malformedFlag();
    }

    return [EvalResult.flagOff(disabledVariation.value), new EvalEvent(context.user, flag.key, disabledVariation, false)];
  }

  private evaluateRules(
    flag: IFlag,
    context: Context,
  ): [EvalResult, EvalEvent | null] {
    let dispatchKey: string;

    for (const rule of flag.rules) {
      const match = isMatchRule(this.store, rule, context);
      if (match) {
        const ruleDispatchKey = rule.dispatchKey;
        dispatchKey = Regex.isNullOrWhiteSpace(ruleDispatchKey)
          ? `${ flag.key }${ context.key }`
          : `${ flag.key }${ context.value(ruleDispatchKey) }`;

        const rolloutVariation = rule.variations.find(v => DispatchAlgorithm.isInRollout(this.platform.crypto, dispatchKey, v.rollout))
        if (!rolloutVariation) {
          return this.malformedFlag();
        }

        const [evalEvent, variation] = this.getEvalEventAndVariation(context, flag, dispatchKey, rolloutVariation);
        return [EvalResult.ruleMatched(variation.value, rule.name), evalEvent];
      }
    }

    // match default rule
    const fallthroughDispatchKey = flag.fallthrough?.dispatchKey;
    dispatchKey = Regex.isNullOrWhiteSpace(fallthroughDispatchKey)
      ? `${ flag.key }${ context.key }`
      : `${ flag.key }${ context.value(fallthroughDispatchKey) }`;

    const defaultVariation = flag.fallthrough?.variations.find(v => DispatchAlgorithm.isInRollout(this.platform.crypto, dispatchKey, v.rollout));
    if (!defaultVariation) {
      return this.malformedFlag();
    }

    const [evalEvent, variation] = this.getEvalEventAndVariation(context, flag, dispatchKey, defaultVariation);
    return [EvalResult.fallthrough(variation.value), evalEvent];
  }

  private malformedFlag(): [EvalResult, null] {
    return [EvalResult.malformedFlag(), null];
  }

  private shouldSendToExperiment(
    exptIncludeAllTargets: boolean,
    thisRuleIncludeInExpt: boolean,
    dispatchKey: string,
    rolloutVariation: IRolloutVariation
  ): boolean {
    if (exptIncludeAllTargets) {
      return true;
    }

    if (!thisRuleIncludeInExpt) {
      return false;
    }

    // create a new key to calculate the experiment dispatch percentage
    const exptDispatchKeyPrefix = "expt";
    const sendToExptKey = `${ exptDispatchKeyPrefix }${ dispatchKey }`;

    const exptRollout = rolloutVariation.exptRollout;
    const dispatchRollout = DispatchAlgorithm.dispatchRollout(rolloutVariation.rollout);
    if (exptRollout == 0.0 || dispatchRollout == 0.0) {
      return false;
    }

    var upperBound = exptRollout / dispatchRollout;
    if (upperBound > 1.0) {
      upperBound = 1.0;
    }

    return DispatchAlgorithm.isInRollout(this.platform.crypto, sendToExptKey, [0.0, upperBound]);
  }

  private getEvalEventAndVariation(context: Context, flag: IFlag, dispatchKey: string, rolloutVariation: IRolloutVariation): [EvalEvent, IVariation] {
    const variation = flag.variations.find(v => v.id === rolloutVariation.id)!;

    const sendToExperiment = this.shouldSendToExperiment(
      flag.exptIncludeAllTargets,
      flag.fallthrough?.includedInExpt,
      dispatchKey,
      rolloutVariation);

    const evalEvent = new EvalEvent(context.user, flag.key, variation, sendToExperiment);

    return [evalEvent, variation];
  }
}