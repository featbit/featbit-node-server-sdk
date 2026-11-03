import { IRolloutVariation } from "./IRolloutVariation";

export interface IFallthrough {
  dispatchKey: string;
  variations: IRolloutVariation[];
}