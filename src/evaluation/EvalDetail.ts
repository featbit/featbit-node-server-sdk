import ReasonKinds from "./ReasonKinds";

export interface EvalDetail<TValue> {
    /**
     * The result of the flag evaluation. This will be either one of the flag's variations or
     * the default value that was passed to `LDClient.variationDetail`.
     */
    kind: ReasonKinds;

    /**
     * The result of the flag evaluation. This will be either one of the flag's variations or
     * the default value that was passed to `LDClient.variationDetail`.
     */
    value?: TValue;

    /**
     * An object describing the main factor that influenced the flag evaluation value.
     */
    reason?: string;
}