import { ITargetUser } from "./ITargetUser";
import { IVariation } from "./IVariation";
import { ITargetRule } from "./IRule";
import { IFallthrough } from "./IFallthrough";

export interface IFlag {
  fallthrough: IFallthrough;
  version: number;
  key: string;
  isEnabled: boolean;
  targetUsers: ITargetUser[];
  variations: IVariation[];
  disabledVariationId: string;
  rules: ITargetRule[];
  updatedAt: string;
  exptIncludeAllTargets: boolean;
}
