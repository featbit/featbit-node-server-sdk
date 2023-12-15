import { IStreamProcessor } from "./StreamProcessor";
import ClientContext from "../options/ClientContext";
import { EventName, ProcessStreamResponse, StreamingErrorHandler } from "./types";
import { ILogger } from "../logging/Logger";
import { IRequests } from "../platform/IRequests";
import { StreamingError } from "../errors";
import { IWebSocketWithEvents } from "../platform/IWebSocket";
import NodeWebSocket from "../platform/NodeWebSocket";
import { IStore } from "../subsystems/Store";

const reportJsonError = (
    type: string,
    data: string,
    logger?: ILogger,
    errorHandler?: StreamingErrorHandler,
) => {
    logger?.error(`Stream received invalid data in "${type}" message`);
    logger?.debug(`Invalid JSON follows: ${data}`);
    errorHandler?.(new StreamingError('Malformed JSON data in event stream'));
};

class StreamingProcessor implements IStreamProcessor {
    private socket?: IWebSocketWithEvents;
    private readonly streamUri: string;
    private readonly logger?: ILogger;

    private requests: IRequests;
    private connectionAttemptStartTime?: number;

    constructor(
        sdkKey: string,
        clientContext: ClientContext,
        private readonly store: IStore,
        private readonly listeners: Map<EventName, ProcessStreamResponse>,
        webSocketHandshakeTimeout?: number
    ) {
        const { basicConfiguration, platform } = clientContext;
        const { logger } = basicConfiguration;
        const { requests } = platform;

        this.logger = logger;
        this.requests = requests;
        this.streamUri = basicConfiguration.serviceEndpoints.streaming;
        this.socket = new NodeWebSocket(
          sdkKey,
          this.streamUri,
          this.logger!,
          () => store.version,
          webSocketHandshakeTimeout);

        this.listeners.forEach(({ deserializeData, processJson }, eventName) => {
            this.socket?.addListener(eventName, (event) => {
                this.logger?.debug(`Received ${eventName} event`);

                if (event?.data) {
                    this.logger?.debug(event.data);
                    const { featureFlags, segments } = event.data;
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
        this.logger?.info(`Stream connection attempt StartTime ${this.connectionAttemptStartTime}`);
    }

    close(): void {
        this.stop();
    }

    stop(): void {
        this.socket?.close();
        this.socket = undefined;
    }
}

export default StreamingProcessor;