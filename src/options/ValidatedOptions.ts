import { ILogger } from "../logging/Logger";
import { IStore } from "../store/Store";
import { IOptions } from "./Options";
import { IDataSynchronizer } from "../streaming/DataSynchronizer";

export interface ValidatedOptions {
    startWaitTime: number;
    sdkKey: string;
    pollingUri: string;
    streamingUri: string;
    eventsUri: string;
    stream: boolean;
    webSocketHandshakeTimeout?: number;
    webSocketPingInterval?: number;
    flushInterval: number;
    maxEventsInQueue: number;
    pollingInterval: number;
    offline: boolean;
    store: IStore | ((options: IOptions) => IStore);
    dataSynchronizer?: IDataSynchronizer;
    logger?: ILogger;
    // Allow indexing this by a string for the validation step.
    [index: string]: any;
}