import { ITargetUser } from "./TargetUser";
import { IVariation } from "./Variation";
import { ITargetRule } from "./Rule";
import { IFallthrough } from "./Fallthrough";

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
