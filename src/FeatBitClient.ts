import { IFeatBitClient } from "./interfaces/FeatBitClient";
import { IOptions } from "./interfaces/Options";
import { IPlatform } from "./platform/Platform";
import Configuration from "./Configuration";
import { ILogger } from "./logging/Logger";
import ClientContext from "./options/ClientContext";
import DataSourceUpdates from "./data_sources/DataSourceUpdates";
import AsyncStoreFacade from "./store/AsyncStoreFacade";
import { IFeatureStore } from "./subsystems/FeatureStore";
import { createStreamListeners } from "./data_sources/createStreamListeners";
import { IContext } from "./interfaces/Context";
import { EvaluationDetail } from "./interfaces/EvaluationDetail";
import { IFlagsStateOptions } from "./interfaces/FlagsStateOptions";
import { IFlagsState } from "./interfaces/FlagState";
import StreamingProcessor from "./streaming/StreamingProcessor";
import PollingProcessor from "./streaming/PollingProcessor";
import Requestor from "./streaming/Requestor";
import { IStreamProcessor } from "./streaming/StreamProcessor";

enum ClientState {
  Initializing,
  Initialized,
  Failed,
}

export interface IClientCallbacks {
  onError: (err: Error) => void;
  onFailed: (err: Error) => void;
  onReady: () => void;
  // Called whenever flags change, if there are listeners.
  onUpdate: (key: string) => void;
  // Method to check if event listeners have been registered.
  // If none are registered, then onUpdate will never be called.
  hasEventListeners: () => boolean;
}

export class FeatBitClient implements IFeatBitClient {
  private state: ClientState = ClientState.Initializing;

  private featureStore: IFeatureStore;

  private asyncFeatureStore: AsyncStoreFacade;

  private updateProcessor?: IStreamProcessor;

  private initResolve?: (value: IFeatBitClient | PromiseLike<IFeatBitClient>) => void;

  private initReject?: (err: Error) => void;

  private rejectionReason: Error | undefined;

  private logger?: ILogger;

  private config: Configuration;

  private onError: (err: Error) => void;

  private onFailed: (err: Error) => void;

  private onReady: () => void;

  constructor(
    private options: IOptions,
    private platform: IPlatform,
    callbacks: IClientCallbacks
  ) {
    this.onError = callbacks.onError;
    this.onFailed = callbacks.onFailed;
    this.onReady = callbacks.onReady;

    const {onUpdate, hasEventListeners} = callbacks;
    const config = new Configuration(options);

    if (!config.sdkKey && !config.offline) {
      throw new Error('You must configure the client with an SDK key');
    }

    this.config = config;
    this.logger = config.logger;

    const clientContext = new ClientContext(config.sdkKey, config, platform);
    const featureStore = config.featureStoreFactory(clientContext);
    this.asyncFeatureStore = new AsyncStoreFacade(featureStore);
    const dataSourceUpdates = new DataSourceUpdates(featureStore, hasEventListeners, onUpdate);

    this.featureStore = featureStore;

    const listeners = createStreamListeners(dataSourceUpdates, this.logger, {
      put: () => this.initSuccess(),
    });

    const makeDefaultProcessor = () =>
      config.stream
        ? new StreamingProcessor(
          this.config.sdkKey,
          clientContext,
          this.featureStore,
          listeners,
          this.config.webSocketHandshakeTimeout
        )
        : new PollingProcessor(
          config,
          new Requestor(this.config.sdkKey, config, this.platform.info, this.platform.requests),
          dataSourceUpdates,
          () => this.initSuccess(),
          (e) => this.dataSourceErrorHandler(e),
        );

      if (!config.offline) {
          this.updateProcessor =
            config.updateProcessorFactory?.(
              clientContext,
              dataSourceUpdates,
              () => this.initSuccess(),
              (e) => this.dataSourceErrorHandler(e),
            ) ?? makeDefaultProcessor();
      }

      if (this.updateProcessor) {
          this.updateProcessor.start();
      } else {
          // Deferring the start callback should allow client construction to complete before we start
          // emitting events. Allowing the client an opportunity to register events.
          setTimeout(() => this.initSuccess(), 0);
      }
  }

  waitForInitialization(): Promise<IFeatBitClient> {
    throw new Error("Method not implemented.");
  }

  variation(key: string, context: IContext, defaultValue: any, callback?: ((err: any, res: any) => void) | undefined): Promise<any> {
    throw new Error("Method not implemented.");
  }

  variationDetail(key: string, context: IContext, defaultValue: any, callback?: ((err: any, res: EvaluationDetail) => void) | undefined): Promise<EvaluationDetail> {
    throw new Error("Method not implemented.");
  }

  allFlagsState(context: IContext, options?: IFlagsStateOptions | undefined, callback?: ((err: Error | null, res: IFlagsState | null) => void) | undefined): Promise<IFlagsState> {
    throw new Error("Method not implemented.");
  }

  close(): void {
    throw new Error("Method not implemented.");
  }

  isOffline(): boolean {
    throw new Error("Method not implemented.");
  }

  track(key: string, context: IContext, data?: any, metricValue?: number | undefined): void {
    throw new Error("Method not implemented.");
  }

  identify(context: IContext): void {
    throw new Error("Method not implemented.");
  }

  flush(callback?: ((err: Error | null, res: boolean) => void) | undefined): Promise<void> {
    throw new Error("Method not implemented.");
  }

  initialized(): boolean {
    return this.state === ClientState.Initialized;
  }

  private dataSourceErrorHandler(e: any) {
    const error =
      e.code === 401 ? new Error('Authentication failed. Double check your SDK key.') : e;

    this.onError(error);
    this.onFailed(error);

    if (!this.initialized()) {
      this.state = ClientState.Failed;
      this.rejectionReason = error;
      this.initReject?.(error);
    }
  }

  private initSuccess() {
    if (!this.initialized()) {
      this.state = ClientState.Initialized;
      this.initResolve?.(this);
      this.onReady();
    }
  }
}
