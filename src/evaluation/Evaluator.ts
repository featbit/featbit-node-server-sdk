import Context from "../Context";
import { IFlag } from "./data/IFlag";
import EvalResult from "./EvalResult";
import { IPlatform } from "../platform/IPlatform";
import { isMatchRule } from "./evalRules";
import { Regex } from "../utils/Regex";
import { DispatchAlgorithm } from "./DispatchAlgorithm";
import { IVariation } from "./data/IVariation";
import { IStore } from "../store/store";
import VersionedDataKinds from "../store/VersionedDataKinds";
import {EvalEvent} from "../events/event";
import {ITargetRule} from "./data/IRule";
import {IRolloutVariation} from "./data/IRolloutVariation";

/**
 * @internal
 */
export default class Evaluator {
  constructor(private platform: IPlatform, private store: IStore) {
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
  ): [EvalResult, EvalEvent | null] {
    const flag = this.store.get(VersionedDataKinds.Flags, flagKey) as IFlag;
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

  /**
   * Evaluate the targets of the specified flag against the given context.
   * @param flag The flag to evaluate targets for.
   * @param context The context to evaluate those targets against.
   * @returns An evaluation result if there is a target match/error or undefined if there is not.
   *
   * @internal
   */
  private evalTargets(flag: IFlag, context: Context): [EvalResult | null, EvalEvent | null] {
    const target = flag.targetUsers.find(t => t.keyIds.indexOf(context.key))

    if (target) {
      const targetedVariation = this.getVariation(flag, target.variationId);
      return [EvalResult.targeted(targetedVariation!.value), new EvalEvent(context.user, flag.key, targetedVariation!, flag.exptIncludeAllTargets)];
    }

    return [null, null];
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
  private evalDisabledVariation(flag: IFlag, context: Context): [EvalResult, EvalEvent | null] {
    const disabledVariation = this.getVariation(flag, flag.disabledVariationId);
    if (!disabledVariation) {
      return this.malformedFlag();
    }

    return [EvalResult.flagOff(disabledVariation.value), new EvalEvent(context.user, flag.key, disabledVariation, false)];
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
  ): [EvalResult, EvalEvent | null] {
    let dispatchKey: string;

    for(const rule of flag.rules) {
      const match = isMatchRule(this.store, rule, context);
      if(match) {
        const ruleDispatchKey = rule.dispatchKey;
        dispatchKey = Regex.isNullOrWhiteSpace(ruleDispatchKey)
          ? `${flag.key}${context.key}`
          : `${flag.key}${context.value(ruleDispatchKey)}`;

        const rolloutVariation = rule.variations.find(v => DispatchAlgorithm.isInRollout(this.platform.crypto, dispatchKey, v.rollout))
        if (!rolloutVariation) {
          return this.malformedFlag();
        }

        const [evalEvent, variation] = this.getEvalEventAndVariation(context, flag, dispatchKey, rolloutVariation);
        return [EvalResult.ruleMatched(variation.value, rule.name), evalEvent];
      }
    }

    // match default rule
    const fallthroughDispatchKey = flag.fallthrough.dispatchKey;
    dispatchKey = Regex.isNullOrWhiteSpace(fallthroughDispatchKey)
      ? `${flag.key}${context.key}`
      : `${flag.key}${context.value(fallthroughDispatchKey)}`;

    const defaultVariation = flag.fallthrough.variations.find(v => DispatchAlgorithm.isInRollout(this.platform.crypto, dispatchKey, v.rollout));
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

    if (!thisRuleIncludeInExpt)
    {
      return false;
    }

    // create a new key to calculate the experiment dispatch percentage
    const exptDispatchKeyPrefix = "expt";
    const sendToExptKey = `${exptDispatchKeyPrefix}${dispatchKey}`;

    const exptRollout = rolloutVariation.exptRollout;
    const dispatchRollout = DispatchAlgorithm.dispatchRollout(rolloutVariation.rollout);
    if (exptRollout == 0.0 || dispatchRollout == 0.0)
    {
      return false;
    }

    var upperBound = exptRollout / dispatchRollout;
    if (upperBound > 1.0)
    {
      upperBound = 1.0;
    }

    return DispatchAlgorithm.isInRollout(this.platform.crypto, sendToExptKey, [0.0, upperBound]);
  }

  private getEvalEventAndVariation(context: Context, flag: IFlag, dispatchKey: string, rolloutVariation: IRolloutVariation): [EvalEvent, IVariation] {
    const variation = this.getVariation(flag, rolloutVariation.id)!;

    const sendToExperiment = this.shouldSendToExperiment(
      flag.exptIncludeAllTargets,
      flag.fallthrough.includedInExpt,
      dispatchKey,
      rolloutVariation);

    const evalEvent = new EvalEvent(context.user, flag.key, variation, sendToExperiment);

    return [evalEvent, variation];
  }
}