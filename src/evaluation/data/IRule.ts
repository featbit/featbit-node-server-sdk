import { ICondition } from "./ICondition";
import { IRolloutVariation } from "./IRolloutVariation";

export interface IMatchRule {
  id: string;
  name: string;
  conditions: ICondition[];
}

export interface ITargetRule extends IMatchRule {
  dispatchKey: string;
  variations: IRolloutVariation[];
  includedInExpt?: boolean;
}