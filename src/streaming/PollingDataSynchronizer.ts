import { isHttpRecoverable, PollingError } from "../errors";
import { IDataSynchronizer } from "./DataSynchronizer";
import { ILogger } from "../logging/Logger";
import Configuration from "../Configuration";
import DataSourceUpdates from "../data_sources/DataSourceUpdates";
import { VoidFunction } from "../utils/VoidFunction";
import { PollingErrorHandler } from "./types";
import Requestor from "./Requestor";
import { httpErrorMessage } from "../utils/http";
import VersionedDataKinds from "../store/VersionedDataKinds";
import { getTimestampFromDateTimeString } from "./utils";

export default class PollingDataSynchronizer implements IDataSynchronizer {
  private stopped = false;

  private logger?: ILogger;

  private pollInterval: number;

  private timeoutHandle: any;

  constructor(
    config: Configuration,
    private readonly requestor: Requestor,
    private readonly store: DataSourceUpdates,
    private readonly initSuccessHandler: VoidFunction = () => {},
    private readonly errorHandler?: PollingErrorHandler,
  ) {
    this.logger = config.logger;
    this.pollInterval = config.pollInterval;
  }

  private poll() {
    if (this.stopped) {
      return;
    }

    const reportJsonError = (data: string) => {
      this.logger?.error('Polling received invalid data');
      this.logger?.debug(`Invalid JSON follows: ${data}`);
      this.errorHandler?.(new PollingError('Malformed JSON data in polling response'));
    };

    const startTime = Date.now();
    this.logger?.debug('Polling FeatBit for feature flag updates');
    this.requestor.requestAllData((err, body) => {
      const elapsed = Date.now() - startTime;
      const sleepFor = Math.max(this.pollInterval - elapsed, 0);

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
          const initData = {
            [VersionedDataKinds.Features.namespace]: message.data.featureFlags.reduce((acc: any, cur: any) => {
              acc[cur.key] = {...cur, version: getTimestampFromDateTimeString(cur.updatedAt)};
              return acc;
            }, {}),
            [VersionedDataKinds.Segments.namespace]: message.data.segments.reduce((acc: any, cur: any) => {
              acc[cur.id] = {...cur, version: getTimestampFromDateTimeString(cur.updatedAt)};
              return acc;
            }, {}),
          };

          this.store.init(initData, () => {
            this.initSuccessHandler();
            // Triggering the next poll after the init has completed.
            this.timeoutHandle = setTimeout(() => {
              this.poll();
            }, sleepFor);
          });
        }

        // The poll will be triggered by  the feature store initialization
        // completing.
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



