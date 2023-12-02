import { FlagValue } from "../data/FlagValue";
import { EvaluationReason } from "./EvaluationReason";

export interface EvaluationDetail {
    value: FlagValue;
    reason: EvaluationReason;
}