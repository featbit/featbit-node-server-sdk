import { ILogger } from "./logging/Logger";
import { IStore } from "./subsystems/Store";
import { IOptions } from "./interfaces/Options";
import { IDataSynchronizer } from "./streaming/DataSynchronizer";

export interface ValidatedOptions {
    sdkKey: string;
    baseUri: string;
    stream: boolean;
    sendEvents: boolean;
    webSocketHandshakeTimeout?: number;
    capacity: number;
    flushInterval: number;
    pollInterval: number;
    offline: boolean;
    useLdd: boolean;
    allAttributesPrivate: false;
    privateAttributes: string[];
    contextKeysCapacity: number;
    contextKeysFlushInterval: number;
    diagnosticOptOut: boolean;
    diagnosticRecordingInterval: number;
    store: IStore | ((options: IOptions) => IStore);
    dataSynchronizer?: IDataSynchronizer;
    wrapperName?: string;
    wrapperVersion?: string;
    application?: { id?: string; version?: string };
    logger?: ILogger;
    // Allow indexing this by a string for the validation step.
    [index: string]: any;
}