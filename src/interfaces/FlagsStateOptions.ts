/**
 * Optional settings that can be passed to `LDClient.allFlagsState`.
 */
export interface IFlagsStateOptions {
    /**
     * True if evaluation reason data should be captured in the state object (see
     * IFeatBit.variationDetail). By default, it is not included in the state object.
     */
    withReasons?: boolean;
}