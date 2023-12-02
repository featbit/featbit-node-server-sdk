import { isHttpRecoverable, PollingError } from "../errors";
import { IStreamProcessor } from "./StreamProcessor";
import { ILogger } from "../logging/Logger";
import Configuration from "../Configuration";
import DataSourceUpdates from "../data_sources/DataSourceUpdates";
import { VoidFunction } from "../utils/VoidFunction";
import { PollingErrorHandler } from "./types";
import Requestor from "./Requestor";
import { httpErrorMessage } from "../utils/http";
import VersionedDataKinds from "../store/VersionedDataKinds";
import { deserializePoll } from "../store/serialization";

export default class PollingProcessor implements IStreamProcessor {
  private stopped = false;

  private logger?: ILogger;

  private pollInterval: number;

  private timeoutHandle: any;

  constructor(
    config: Configuration,
    private readonly requestor: Requestor,
    private readonly featureStore: DataSourceUpdates,
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
      const sleepFor = Math.max(this.pollInterval * 1000 - elapsed, 0);

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
        const parsed = deserializePoll(body);
        if (!parsed) {
          // We could not parse this JSON. Report the problem and fallthrough to
          // start another poll.
          reportJsonError(body);
        } else {
          const initData = {
            [VersionedDataKinds.Features.namespace]: parsed.flags,
            [VersionedDataKinds.Segments.namespace]: parsed.segments,
          };
          this.featureStore.init(initData, () => {
            this.initSuccessHandler();
            // Triggering the next poll after the init has completed.
            this.timeoutHandle = setTimeout(() => {
              this.poll();
            }, sleepFor);
          });
          // The poll will be triggered by  the feature store initialization
          // completing.
          return;
        }
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



