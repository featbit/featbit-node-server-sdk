import { FlagValue } from "../data/FlagValue";

/**
 * A map of feature flags from their keys to their values.
 */
export interface IFlagSet {
    [key: string]: FlagValue;
}