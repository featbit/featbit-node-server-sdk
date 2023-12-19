import { IFbClient } from "./IFbClient";
import { IPlatform } from "./platform/IPlatform";
import Configuration from "./Configuration";
import { ILogger } from "./logging/ILogger";
import ClientContext from "./options/ClientContext";
import DataSourceUpdates from "./data_sources/DataSourceUpdates";
import { createStreamListeners } from "./data_sources/createStreamListeners";
import { IEvalDetail } from "./evaluation/IEvalDetail";
import WebSocketDataSynchronizer from "./streaming/WebSocketDataSynchronizer";
import PollingDataSynchronizer from "./streaming/PollingDataSynchronizer";
import Requestor from "./streaming/Requestor";
import { IDataSynchronizer } from "./streaming/IDataSynchronizer";
import VersionedDataKinds from "./store/VersionedDataKinds";
import Evaluator from "./evaluation/Evaluator";
import ReasonKinds from "./evaluation/ReasonKinds";
import { ClientError } from "./errors";
import Context from "./Context";
import { IConvertResult, ValueConverters } from "./utils/ValueConverters";
import { NullDataSynchronizer } from "./streaming/NullDataSynchronizer";
import { IEventProcessor } from "./events/IEventProcessor";
import { NullEventProcessor } from "./events/NullEventProcessor";
import { DefaultEventProcessor } from "./events/DefaultEventProcessor";
import { IStore } from "./store/store";
import { IOptions } from "./options/IOptions";
import { IUser } from "./options/IUser";
import { MetricEvent } from "./events/event";

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

export class FbClient implements IFbClient {
  private state: ClientState = ClientState.Initializing;

  private store: IStore;

  private dataSynchronizer: IDataSynchronizer;

  private eventProcessor: IEventProcessor;

  private evaluator: Evaluator;

  private initResolve?: (value: IFbClient | PromiseLike<IFbClient>) => void;

  private initReject?: (err: Error) => void;

  private rejectionReason: Error | undefined;

  private initializedPromise?: Promise<IFbClient>;

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
            () => this.store.version,
            listeners,
            this.config.webSocketPingInterval,
            this.config.webSocketHandshakeTimeout
          )
          : new PollingDataSynchronizer(
            config,
            new Requestor(this.config.sdkKey, config, this.platform.info, this.platform.requests),
            () => this.store.version,
            listeners,
            (e) => this.dataSourceErrorHandler(e),
          );

      this.dataSynchronizer = config.dataSynchronizerFactory?.(
          clientContext,
          dataSourceUpdates,
          () => this.initSuccess(),
          (e) => this.dataSourceErrorHandler(e),
        ) ?? dataSynchronizer;
    }

    this.start();
  }

  private start() {
    this.dataSynchronizer.start();
    setTimeout(() => {
      if (!this.initialized()) {
        const msg = `FbClient failed to start successfully within ${this.config.startWaitTime} milliseconds. ` +
          'This error usually indicates a connection issue with FeatBit or an invalid sdkKey.' +
          'Please double-check your sdkKey and streamingUri/pollingUri configuration. ' +
          'We will continue to initialize the FbClient, it still have a chance to get to work ' +
          'if it\'s a temporary network issue';

        const error = new Error(msg);
        this.state = ClientState.Failed;
        this.rejectionReason = error;
        this.initReject?.(error);

        return this.logger?.warn(msg);
      }

      this.logger?.info('FbClient started successfully.');
    }, this.config.startWaitTime);
  }

  initialized(): boolean {
    return this.state === ClientState.Initialized;
  }

  waitForInitialization(): Promise<IFbClient> {
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
  ): IEvalDetail<boolean> {
    return this.evaluateCore(key, user, defaultValue, ValueConverters.bool);
  }

  jsonVariation(key: string, user: IUser, defaultValue: unknown): unknown {
    return this.evaluateCore(key, user, defaultValue, ValueConverters.json).value!;
  }

  jsonVariationDetail(key: string, user: IUser, defaultValue: unknown): IEvalDetail<unknown> {
    return this.evaluateCore(key, user, defaultValue, ValueConverters.json);
  }

  numberVariation(key: string, user: IUser, defaultValue: number): number {
    return this.evaluateCore(key, user, defaultValue, ValueConverters.number).value!;
  }

  numberVariationDetail(key: string, user: IUser, defaultValue: number): IEvalDetail<number> {
    return this.evaluateCore(key, user, defaultValue, ValueConverters.number);
  }

  stringVariation(key: string, user: IUser, defaultValue: string): string {
    return this.evaluateCore(key, user, defaultValue, ValueConverters.string).value!;
  }

  stringVariationDetail(key: string, user: IUser, defaultValue: string): IEvalDetail<string> {
    return this.evaluateCore(key, user, defaultValue, ValueConverters.string);
  }

  getAllVariations(
    user: IUser,
  ): IEvalDetail<string>[] {
    const context = Context.fromUser(user);
    if (!context.valid) {
      const error = new ClientError(
        `${context.message ?? 'User not valid;'} returning default value.`,
      );
      this.onError(error);

      return [];
    }

    const flags = this.store.all(VersionedDataKinds.Flags);
    return Object.keys(flags).map(flagKey => {
      const [evalResult, _] = this.evaluator.evaluate(flagKey, context);
      return { kind: evalResult.kind, reason: evalResult.reason, value: evalResult.value };
    });
  }

  async close(): Promise<void> {
    await this.eventProcessor.close();
    this.dataSynchronizer?.close();
    this.store.close();
  }

  isOffline(): boolean {
    return this.config.offline;
  }

  track(user: IUser, eventName: string, metricValue?: number | undefined): void {
    const metricEvent = new MetricEvent(user, eventName, this.platform.info.appType, metricValue ?? 1);
    this.eventProcessor.record(metricEvent);
    return;
  }

  async flush(callback?: (res: boolean) => void): Promise<boolean> {
    try {
      await this.eventProcessor.flush();
      callback?.(true);
      return true;
    } catch (err) {
      callback?.(false);
      return false;
    }
  }

  private evaluateCore<TValue>(
    flagKey: string,
    user: IUser,
    defaultValue: TValue,
    typeConverter: (value: string) => IConvertResult<TValue>
  ): IEvalDetail<TValue> {
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