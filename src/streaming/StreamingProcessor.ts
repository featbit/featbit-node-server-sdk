import { IStreamProcessor } from "./StreamProcessor";
import ClientContext from "../options/ClientContext";
import { StreamingErrorHandler } from "./types";
import { ILogger } from "../logging/Logger";
import { IRequests } from "../platform/IRequests";
import { StreamingError } from "../errors";
import { IWebSocketWithEvents } from "../platform/IWebSocket";
import { EventName, ProcessStreamResponse } from "../platform/IEventSource";
import NodeWebSocket from "../platform/NodeWebSocket";
import { IFeatureStore } from "../subsystems/FeatureStore";

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
        private readonly store: IFeatureStore,
        private readonly listeners: Map<EventName, ProcessStreamResponse>
    ) {
        const { basicConfiguration, platform } = clientContext;
        const { logger } = basicConfiguration;
        const { requests } = platform;

        this.logger = logger;
        this.requests = requests;
        this.streamUri = basicConfiguration.serviceEndpoints.streaming;
        this.socket = new NodeWebSocket(
          this.streamUri,
          sdkKey,
          this.logger!,
          () => store.version);

        this.listeners.forEach(({ deserializeData, processJson }, eventName) => {
            this.socket?.addListener(eventName, (event) => {
                this.logger?.debug(`Received ${eventName} event`);

                if (event?.data) {
                    this.logger?.debug(event.data);
                    const { featureFlags, segments } = event.data;
                    processJson({ flags: featureFlags, segments });
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