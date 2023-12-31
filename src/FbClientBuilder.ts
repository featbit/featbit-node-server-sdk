import { IFbClient } from "./IFbClient";
import { IOptions } from "./options/IOptions";
import FbClientNode from "./platform/node/FbClientNode";
import { IDataSynchronizer } from "./streaming/IDataSynchronizer";
import { IClientContext } from "./options/IClientContext";
import { IDataSourceUpdates } from "./store/IDataSourceUpdates";
import { VoidFunction } from "./utils/VoidFunction";
import { ILogger } from "./logging/ILogger";
import { IBootstrapProvider } from "./bootstrap/IBootstrapProvider";
import { JsonBootstrapProvider } from "./bootstrap/JsonBootstrapProvider";

/**
 * Creates an instance of the FeatBit client.
 *
 * Applications should instantiate a single instance for the lifetime of the application.
 * The client will begin attempting to connect to FeatBit as soon as it is created. To
 * determine when it is ready to use, call {@link IFbClient.waitForInitialization}, or register an
 * event listener for the `"ready"` event using {@link IFbClient.on}.
 *
 * **Important:** Do **not** try to instantiate `FbClient` with its constructor
 * (`new FbClientNode()`); the SDK does not currently support
 * this.
 *
 * @return
 *   The new {@link IFbClient} instance.
 */
export class FbClientBuilder {
  private _options: IOptions;

  constructor(options?: IOptions) {
    this._options = options ?? {};
  }

  /**
   * Creates a new instance of the FeatBit client.
   */
  build(): IFbClient {
    return new FbClientNode(this._options);
  }

  /**
   * Refer to {@link IOptions.startWaitTime}.
   */
  startWaitTime(startWaitTime: number): FbClientBuilder {
    this._options.startWaitTime = startWaitTime;
    return this;
  }

  /**
   * Refer to {@link IOptions.sdkKey}.
   */
  sdkKey(sdkKey: string): FbClientBuilder {
    this._options.sdkKey = sdkKey;
    return this;
  }

  /**
   * Refer to {@link IOptions.streamingUri}.
   */
  streamingUri(streamingUri: string): FbClientBuilder {
    this._options.streamingUri = streamingUri;
    return this;
  }

  /**
   * Refer to {@link IOptions.pollingUri}.
   */
  pollingUri(pollingUri: string): FbClientBuilder {
    this._options.pollingUri = pollingUri;
    return this;
  }

  /**
   * Refer to {@link IOptions.eventsUri}.
   */
  eventsUri(eventsUri: string): FbClientBuilder {
    this._options.eventsUri = eventsUri;
    return this;
  }

  /**
   * Refer to {@link IOptions.stream}.
   */
  stream(stream: boolean): FbClientBuilder {
    this._options.stream = stream;
    return this;
  }

  /**
   * Refer to {@link IOptions.pollingInterval}.
   */
  pollingInterval(pollingInterval: number): FbClientBuilder {
    this._options.pollingInterval = pollingInterval;
    return this;
  }

  /**
   * Refer to {@link IOptions.flushInterval}.
   */
  flushInterval(flushInterval: number): FbClientBuilder {
    this._options.flushInterval = flushInterval;
    return this;
  }

  /**
   * Refer to {@link IOptions.maxEventsInQueue}.
   */
  maxEventsInQueue(maxEventsInQueue: number): FbClientBuilder {
    this._options.maxEventsInQueue = maxEventsInQueue;
    return this;
  }

  /**
   * Refer to {@link IOptions.logger}.
   */
  logger(logger: ILogger): FbClientBuilder {
    this._options.logger = logger;
    return this;
  }

  /**
   * Refer to {@link IOptions.webSocketHandshakeTimeout}.
   */
  webSocketHandshakeTimeout(webSocketHandshakeTimeout: number): FbClientBuilder {
    this._options.webSocketHandshakeTimeout = webSocketHandshakeTimeout;
    return this;
  }

  /**
   * Refer to {@link IOptions.offline}.
   */
  offline(offline: boolean): FbClientBuilder {
    this._options.offline = offline;
    return this;
  }

  /**
   * Refer to {@link IOptions.bootstrapProvider}.
   */
  bootstrapProvider(bootstrapProvider: IBootstrapProvider): FbClientBuilder {
    this._options.bootstrapProvider = bootstrapProvider;
    return this;
  }

  /**
   * Use the JsonBootstrapProvider.
   */
  useJsonBootstrapProvider(jsonStr: string): FbClientBuilder {
    this._options.bootstrapProvider = new JsonBootstrapProvider(jsonStr);
    return this;
  }

  /**
   * Refer to {@link IOptions.dataSynchronizer}.
   */
  dataSynchronizer(
    dataSynchronizer: IDataSynchronizer |
    ((
      clientContext: IClientContext,
      dataSourceUpdates: IDataSourceUpdates,
      initSuccessHandler: VoidFunction,
      errorHandler?: (e: Error) => void,
    ) => IDataSynchronizer)
  ): FbClientBuilder {
    this._options.dataSynchronizer = dataSynchronizer;
    return this;
  }
}