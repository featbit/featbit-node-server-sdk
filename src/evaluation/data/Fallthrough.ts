import { IRolloutVariation } from "./RolloutVariation";

export interface IFallthrough {
  dispatchKey: string;
  includedInExpt: boolean;
  variations: IRolloutVariation[];
}