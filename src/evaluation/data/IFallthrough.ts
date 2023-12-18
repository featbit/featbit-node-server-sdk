import { IRolloutVariation } from "./IRolloutVariation";

export interface IFallthrough {
  dispatchKey: string;
  includedInExpt: boolean;
  variations: IRolloutVariation[];
}