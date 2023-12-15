import { IMatchRule } from "./Rule";

export interface ISegment {
    id: string;
    version: number;
    excluded: string[];
    included: string[];
    rules: IMatchRule[];
    updatedAt: string;
}
