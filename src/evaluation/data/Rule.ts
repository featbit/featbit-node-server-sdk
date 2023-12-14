import { ICondition } from "./Condition";
import { IRolloutVariation } from "./RolloutVariation";

export interface IMatchRule {
  id: string;
  name: string;
  conditions: ICondition[];
}

export interface ITargetRule extends IMatchRule {
  dispatchKey: string;
  variations: IRolloutVariation[];
}