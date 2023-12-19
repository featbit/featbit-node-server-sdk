import { IDataSynchronizer } from "./IDataSynchronizer";
import ClientContext from "../options/ClientContext";
import { EventName, ProcessStreamResponse } from "./types";
import { ILogger } from "../logging/ILogger";
import { IWebSocketWithEvents } from "../platform/IWebSocket";
import NodeWebSocket from "../platform/node/NodeWebSocket";

class WebSocketDataSynchronizer implements IDataSynchronizer {
  private socket?: IWebSocketWithEvents;
  private readonly streamingUri: string;
  private readonly logger?: ILogger;

  private connectionAttemptStartTime?: number;

  constructor(
    sdkKey: string,
    clientContext: ClientContext,
    private readonly getStoreTimestamp: () => number,
    private readonly listeners: Map<EventName, ProcessStreamResponse>,
    webSocketPingInterval: number,
    webSocketHandshakeTimeout?: number,
  ) {
    const {logger, streamingUri} = clientContext;

    this.logger = logger;
    this.streamingUri = streamingUri;
    this.socket = new NodeWebSocket(
      sdkKey,
      this.streamingUri,
      this.logger!,
      getStoreTimestamp,
      webSocketPingInterval,
      webSocketHandshakeTimeout);

    this.listeners.forEach(({deserializeData, processJson}, eventName) => {
      this.socket?.addListener(eventName, (event) => {
        this.logger?.debug(`Received ${ eventName } event`);

        if (event?.data) {
          this.logger?.debug(event.data);
          const {featureFlags, segments} = event.data;
          const data = deserializeData(featureFlags, segments);
          processJson(data);
        }
      });
    })
  }

  start(): void {
    this.logConnectionStarted();

    this.socket?.connect();
  }

  private logConnectionStarted() {
    this.connectionAttemptStartTime = Date.now();
    this.logger?.info(`Stream connection attempt StartTime ${ this.connectionAttemptStartTime }`);
  }

  close(): void {
    this.stop();
  }

  stop(): void {
    this.socket?.close();
    this.socket = undefined;
  }
}

export default WebSocketDataSynchronizer;