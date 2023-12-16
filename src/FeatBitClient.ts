import { IFeatBitClient } from "./interfaces/FeatBitClient";
import { IOptions } from "./interfaces/Options";
import { IPlatform } from "./platform/Platform";
import Configuration from "./Configuration";
import { ILogger } from "./logging/Logger";
import ClientContext from "./options/ClientContext";
import DataSourceUpdates from "./data_sources/DataSourceUpdates";
import { IStore } from "./subsystems/Store";
import { createStreamListeners } from "./data_sources/createStreamListeners";
import { IUser } from "./interfaces/User";
import { EvalDetail } from "./evaluation/EvalDetail";
import WebSocketDataSynchronizer from "./streaming/WebSocketDataSynchronizer";
import PollingDataSynchronizer from "./streaming/PollingDataSynchronizer";
import Requestor from "./streaming/Requestor";
import { IDataSynchronizer } from "./streaming/DataSynchronizer";
import VersionedDataKinds from "./store/VersionedDataKinds";
import Evaluator from "./evaluation/Evaluator";
import ReasonKinds from "./evaluation/ReasonKinds";
import { ClientError } from "./errors";
import Context from "./Context";
import { IConvertResult, ValueConverters } from "./ValueConverters";
import { NullDataSynchronizer } from "./streaming/NullDataSynchronizer";
import { IEventProcessor } from "./events/EventProcessor";
import { NullEventProcessor } from "./events/NullEventProcessor";
import { DefaultEventProcessor } from "./events/DefaultEventProcessor";

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

  private store: IStore;

  private dataSynchronizer: IDataSynchronizer;

  private eventProcessor: IEventProcessor;

  private evaluator: Evaluator;

  private initResolve?: (value: IFeatBitClient | PromiseLike<IFeatBitClient>) => void;

  private initReject?: (err: Error) => void;

  private rejectionReason: Error | undefined;

  private initializedPromise?: Promise<IFeatBitClient>;

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

    const { onUpdate, hasEventListeners } = callbacks;
    const config = new Configuration(options);

    if (!config.sdkKey && !config.offline) {
      throw new Error('You must configure the client with an SDK key');
    }

    this.config = config;
    this.logger = config.logger;

    const clientContext = new ClientContext(config.sdkKey, config, platform);
    this.store = config.storeFactory(clientContext);
    const dataSourceUpdates = new DataSourceUpdates(this.store, hasEventListeners, onUpdate);
    this.evaluator = new Evaluator(this.platform, this.store);

    if (config.offline) {
      this.eventProcessor = new NullEventProcessor();
      this.dataSynchronizer = new NullDataSynchronizer();
    } else {
      this.eventProcessor = new DefaultEventProcessor(clientContext);

      const listeners = createStreamListeners(dataSourceUpdates, this.logger, {
        put: () => this.initSuccess(),
      });

      const dataSynchronizer = config.stream
          ? new WebSocketDataSynchronizer(
            this.config.sdkKey,
            clientContext,
            this.store,
            listeners,
            this.config.webSocketHandshakeTimeout
          )
          : new PollingDataSynchronizer(
            config,
            new Requestor(this.config.sdkKey, config, this.platform.info, this.platform.requests),
            dataSourceUpdates,
            () => this.initSuccess(),
            (e) => this.dataSourceErrorHandler(e),
          );

      this.dataSynchronizer = config.dataSynchronizerFactory?.(
          clientContext,
          dataSourceUpdates,
          () => this.initSuccess(),
          (e) => this.dataSourceErrorHandler(e),
        ) ?? dataSynchronizer;
    }

    this.dataSynchronizer.start();
  }

  initialized(): boolean {
    return this.state === ClientState.Initialized;
  }

  waitForInitialization(): Promise<IFeatBitClient> {
    // An initialization promise is only created if someone is going to use that promise.
    // If we always created an initialization promise, and there was no call waitForInitialization
    // by the time the promise was rejected, then that would result in an unhandled promise
    // rejection.

    // Initialization promise was created by a previous call to waitForInitialization.
    if (this.initializedPromise) {
      return this.initializedPromise;
    }

    // Initialization completed before waitForInitialization was called, so we have completed
    // and there was no promise. So we make a resolved promise and return it.
    if (this.state === ClientState.Initialized) {
      this.initializedPromise = Promise.resolve(this);
      return this.initializedPromise;
    }

    // Initialization failed before waitForInitialization was called, so we have completed
    // and there was no promise. So we make a rejected promise and return it.
    if (this.state === ClientState.Failed) {
      this.initializedPromise = Promise.reject(this.rejectionReason);
      return this.initializedPromise;
    }

    if (!this.initializedPromise) {
      this.initializedPromise = new Promise((resolve, reject) => {
        this.initResolve = resolve;
        this.initReject = reject;
      });
    }
    return this.initializedPromise;
  }

  boolVariation(
    key: string,
    user: IUser,
    defaultValue: boolean
  ): boolean {
    return this.evaluateCore(key, user, defaultValue, ValueConverters.bool).value!;
  }

  boolVariationDetail(
    key: string,
    user: IUser,
    defaultValue: any
  ): EvalDetail<boolean> {
    return this.evaluateCore(key, user, defaultValue, ValueConverters.bool);
  }

  getAllVariations(
    user: IUser,
  ): EvalDetail<string>[] {
    const context = Context.fromUser(user);
    if (!context.valid) {
      const error = new ClientError(
        `${context.message ?? 'User not valid;'} returning default value.`,
      );
      this.onError(error);

      return [];
    }

    const flags = this.store.all(VersionedDataKinds.Features);
    return Object.keys(flags).map(flagKey => {
      const [evalResult, _] = this.evaluator.evaluate(flagKey, context);
      return { kind: evalResult.kind, reason: evalResult.reason, value: evalResult.value };
    });
  }

  close(): void {
    this.eventProcessor.close();
    this.dataSynchronizer?.close();
    this.store.close();
  }

  isOffline(): boolean {
    return this.config.offline;
  }

  track(key: string, context: IUser, data?: any, metricValue?: number | undefined): void {
    throw new Error("Method not implemented.");
  }

  identify(context: IUser): void {
    throw new Error("Method not implemented.");
  }

  flush(callback?: ((err: Error | null, res: boolean) => void) | undefined): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private evaluateCore<TValue>(
    flagKey: string,
    user: IUser,
    defaultValue: TValue,
    typeConverter: (value: string) => IConvertResult<TValue>
  ): EvalDetail<TValue> {
    if (!this.initialized()) {
      this.logger?.warn(
        'Variation called before FeatBit client initialization completed (did you wait for the' +
        "'ready' event?) - using default value",
      );

      return { kind: ReasonKinds.ClientNotReady, reason: 'client not ready', value: defaultValue };
    }

    const context = Context.fromUser(user);
    if (!context.valid) {
      const error = new ClientError(
        `${context.message ?? 'User not valid;'} returning default value.`,
      );
      this.onError(error);

      return { kind: ReasonKinds.ClientNotReady, reason: error.message, value: defaultValue };
    }

    const [evalResult, evalEvent] = this.evaluator.evaluate(flagKey, context);

    if (evalResult.kind === ReasonKinds.Error) {
      // error happened when evaluate flag, return default value
      const error = new ClientError(evalResult.reason!);
      this.onError(error);

      return { kind: evalResult.kind, reason: evalResult.reason, value: defaultValue };
    }

    // send event
    this.eventProcessor.record(evalEvent);

    const { isSucceeded, value } = typeConverter(evalResult.value!);
    return isSucceeded
      ? { kind: evalResult.kind, reason: evalResult.reason, value }
      : { kind: ReasonKinds.WrongType, reason: 'type mismatch', value: defaultValue };
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
