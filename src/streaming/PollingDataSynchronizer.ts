import { isHttpRecoverable, PollingError } from "../errors";
import { IDataSynchronizer } from "./DataSynchronizer";
import { ILogger } from "../logging/Logger";
import Configuration from "../Configuration";
import { EventName, PollingErrorHandler, ProcessStreamResponse, StreamResponseEventType } from "./types";
import Requestor from "./Requestor";
import { httpErrorMessage } from "../utils/http";

export default class PollingDataSynchronizer implements IDataSynchronizer {
  private stopped = false;

  private logger?: ILogger;

  private pollingInterval: number;

  private timeoutHandle: any;

  constructor(
    config: Configuration,
    private readonly requestor: Requestor,
    private readonly getStoreTimestamp: () => number,
    private readonly listeners: Map<EventName, ProcessStreamResponse>,
    private readonly errorHandler?: PollingErrorHandler,
  ) {
    this.logger = config.logger;
    this.pollingInterval = config.pollingInterval;
  }

  private poll() {
    if (this.stopped) {
      return;
    }

    const startTime = Date.now();
    this.logger?.debug('Polling for feature flag and segments updates');
    this.requestor.requestData(this.getStoreTimestamp(),(err, body) => {
      const elapsed = Date.now() - startTime;
      const sleepFor = Math.max(this.pollingInterval - elapsed, 0);

      this.logger?.debug('Elapsed: %d ms, sleeping for %d ms', elapsed, sleepFor);
      if (err) {
        const { status } = err;
        if (status && !isHttpRecoverable(status)) {
          const message = httpErrorMessage(err, 'polling request');
          this.logger?.error(message);
          this.errorHandler?.(new PollingError(message, status));
          // It is not recoverable, return and do not trigger another
          // poll.
          return;
        }
        this.logger?.warn(httpErrorMessage(err, 'polling request', 'will retry'));
      } else if (body) {
        const message = JSON.parse(body);
        if (message.messageType === 'data-sync') {
          let processStreamResponse: ProcessStreamResponse | undefined;
          switch (message.data.eventType) {
            case StreamResponseEventType.patch:
              processStreamResponse = this.listeners.get('patch');
              break;
            case StreamResponseEventType.full:
              processStreamResponse = this.listeners.get('put');
              break;
          }

          const { featureFlags, segments } = message.data;
          const data = processStreamResponse?.deserializeData?.(featureFlags, segments);
          processStreamResponse?.processJson?.(data);

          this.timeoutHandle = setTimeout(() => {
            this.poll();
          }, sleepFor);
        }

        return;
      }

      // Falling through, there was some type of error and we need to trigger
      // a new poll.
      this.timeoutHandle = setTimeout(() => {
        this.poll();
      }, sleepFor);
    });
  }

  close(): void {
    this.stop();
  }

  start(): void {
    this.poll();
  }

  stop(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = undefined;
    }
    this.stopped = true;
  }
}



