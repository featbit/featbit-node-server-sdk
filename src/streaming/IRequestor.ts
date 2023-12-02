/**
 * The FeatBit client feature flag requestor
 *
 * The client uses this internally to retrieve feature flags from FeatBit.
 *
 * @ignore
 */
export interface IRequestor {
  requestAllData: (cb: (err: any, body: any) => void) => void;
}
