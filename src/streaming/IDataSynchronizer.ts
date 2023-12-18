/**
 * The client data synchronizer
 *
 * The client uses this internally to retrieve updates from the FeatBit server.
 *
 * @ignore
 */
export interface IDataSynchronizer {
    start: () => void;
    stop: () => void;
    close: () => void;
}
