import { FlagValue } from "../data/FlagValue";
import { EvaluationReason } from "./EvaluationReason";
import { IFlagSet } from "./FlagSet";

export interface IFlagsState {
    /**
     * True if this object contains a valid snapshot of feature flag state, or false if the
     * state could not be computed (for instance, because the client was offline or there
     * was no user).
     */
    valid: boolean;

    /**
     * Returns the value of an individual feature flag at the time the state was recorded.
     * It will be null if the flag returned the default value, or if there was no such flag.
     *
     * @param key
     *   The flag key.
     */
    getFlagValue(key: string): FlagValue;

    /**
     * Returns the evaluation reason for a feature flag at the time the state was recorded.
     * It will be null if reasons were not recorded, or if there was no such flag.
     *
     * @param key
     *   The flag key.
     */
    getFlagReason(key: string): EvaluationReason | null;

    /**
     * Returns a map of feature flag keys to values. If a flag had evaluated to the
     * default value, its value will be null.
     *
     * Do not use this method if you are passing data to the front end to "bootstrap" the
     * JavaScript client. Instead, use {@link toJSON}.
     */
    allValues(): IFlagSet;

    /**
     * Returns a Javascript representation of the entire state map, in the format used by
     * the Javascript SDK. Use this method if you are passing data to the front end in
     * order to "bootstrap" the JavaScript client.
     *
     * Do not rely on the exact shape of this data, as it may change in future to support
     * the needs of the JavaScript client.
     */
    toJSON(): object;
}