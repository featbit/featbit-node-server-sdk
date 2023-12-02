/**
 * The client stream processor
 *
 * The client uses this internally to retrieve updates from the FeatBit server.
 *
 * @ignore
 */
export interface IStreamProcessor {
    start: () => void;
    stop: () => void;
    close: () => void;
}
