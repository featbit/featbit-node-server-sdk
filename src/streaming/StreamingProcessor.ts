import { IStreamProcessor } from "./StreamProcessor";
import ClientContext from "../options/ClientContext";
import { EventName, IEventSource, ProcessStreamResponse } from "../platform/IEventSource";
import { StreamingErrorHandler } from "./types";
import { ILogger } from "../logging/Logger";
import { IRequests } from "../platform/IRequests";
import { isHttpRecoverable, StreamingError } from "../errors";
import { httpErrorMessage } from "../utils/http";

const STREAM_READ_TIMEOUT_MS = 5 * 60 * 1000;
const RETRY_RESET_INTERVAL_MS = 60 * 1000;

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
    private readonly streamUri: string;
    private readonly logger?: ILogger;

    private eventSource?: IEventSource;
    private requests: IRequests;
    private connectionAttemptStartTime?: number;

    constructor(
        sdkKey: string,
        clientContext: ClientContext,
        streamUriPath: string,
        private readonly listeners: Map<EventName, ProcessStreamResponse>,
        private readonly errorHandler?: StreamingErrorHandler,
        private readonly streamInitialReconnectDelay = 1,
    ) {
        const { basicConfiguration, platform } = clientContext;
        const { logger } = basicConfiguration;
        const { requests } = platform;

        this.logger = logger;
        this.requests = requests;
        this.streamUri = `${basicConfiguration.serviceEndpoints.streaming}${streamUriPath}`;
    }

    private logConnectionStarted() {
        this.connectionAttemptStartTime = Date.now();
        this.logger?.info(`Stream connection attempt StartTime ${this.connectionAttemptStartTime}`);
    }

    private logConnectionResult(success: boolean) {
        success ? this.logger?.info(`Stream connection succeeded`) : this.logger?.info(`Stream connection failed`);

        this.connectionAttemptStartTime = undefined;
    }

    close(): void {
        this.stop();
    }

    start(): void {
        this.logConnectionStarted();

        const errorFilter = (err: { status: number; message: string }): boolean => {
            if (err.status && !isHttpRecoverable(err.status)) {
                this.logConnectionResult(false);
                this.errorHandler?.(new StreamingError(err.message, err.status));
                this.logger?.error(httpErrorMessage(err, 'streaming request'));
                return false;
            }

            this.logger?.warn(httpErrorMessage(err, 'streaming request', 'will retry'));
            this.logConnectionResult(false);
            this.logConnectionStarted();
            return true;
        };

        // TLS is handled by the platform implementation.
        const eventSource = this.requests.createEventSource(this.streamUri, {
            errorFilter,
            initialRetryDelayMillis: 1000 * this.streamInitialReconnectDelay,
            readTimeoutMillis: STREAM_READ_TIMEOUT_MS,
            retryResetIntervalMillis: RETRY_RESET_INTERVAL_MS,
        });
        this.eventSource = eventSource;

        eventSource.onclose = () => {
            this.logger?.info('Closed FeatBit stream connection');
        };

        eventSource.onerror = () => {
            // The work is done by `errorFilter`.
        };

        eventSource.onopen = () => {
            this.logger?.info('Opened FeatBit stream connection');
        };

        eventSource.onretrying = (e) => {
            this.logger?.info(`Will retry stream connection in ${e.delayMillis} milliseconds`);
        };

        this.listeners.forEach(({ deserializeData, processJson }, eventName) => {
            eventSource.addEventListener(eventName, (event) => {
                this.logger?.debug(`Received ${eventName} event`);

                if (event?.data) {
                    this.logConnectionResult(true);
                    const { data } = event;
                    const dataJson = deserializeData(data);

                    if (!dataJson) {
                        reportJsonError(eventName, data, this.logger, this.errorHandler);
                        return;
                    }
                    processJson(dataJson);
                } else {
                    this.errorHandler?.(new StreamingError('Unexpected payload from event stream'));
                }
            });
        });
    }

    stop(): void {
        this.eventSource?.close();
        this.eventSource = undefined;
    }
}

export default StreamingProcessor;