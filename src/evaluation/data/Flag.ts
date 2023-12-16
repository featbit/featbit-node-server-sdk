import { ITargetUser } from "./TargetUser";
import { IVariation } from "./Variation";
import { ITargetRule } from "./Rule";

export interface IFlag {
    fallthrough: ITargetRule;
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
