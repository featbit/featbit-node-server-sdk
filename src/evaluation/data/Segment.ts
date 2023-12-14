import { IMatchRule } from "./Rule";

export interface ISegment {
    key: string;
    version: number;
    excluded: string[];
    included: string[];
    rules: IMatchRule[];
}
