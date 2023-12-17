import { ILogger } from "./logging/Logger";
import { IStore } from "./store/Store";
import { IOptions } from "./options/Options";
import { IDataSynchronizer } from "./streaming/DataSynchronizer";

export interface ValidatedOptions {
    sdkKey: string;
    baseUri: string;
    stream: boolean;
    sendEvents: boolean;
    webSocketHandshakeTimeout?: number;
    webSocketPingInterval?: number;
    capacity: number;
    flushInterval: number;
    maxEventsInQueue: number;
    pollInterval: number;
    offline: boolean;
    store: IStore | ((options: IOptions) => IStore);
    dataSynchronizer?: IDataSynchronizer;
    application?: { id?: string; version?: string };
    logger?: ILogger;
    // Allow indexing this by a string for the validation step.
    [index: string]: any;
}