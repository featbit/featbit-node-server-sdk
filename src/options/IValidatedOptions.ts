import { ILogger } from "../logging/ILogger";
import { IStore } from "../store/store";
import { IOptions } from "./IOptions";
import { IDataSynchronizer } from "../data-sync/IDataSynchronizer";
import { DataSyncModeEnum } from "../data-sync";

export interface IValidatedOptions {
  startWaitTime: number;
  sdkKey: string;
  pollingUri: string;
  streamingUri: string;
  eventsUri: string;
  dataSyncMode: DataSyncModeEnum;
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