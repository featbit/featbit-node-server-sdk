import { ILogger } from "../logging/ILogger";
import { IClientContext } from "../interfaces/IClientContext";
import { IPlatform } from "../platform/IPlatform";
import ServiceEndpoints from "./ServiceEndpoints";

/**
 * Basic configuration applicable to many SDK components for both server and
 * client SDKs.
 */
interface IBasicConfiguration {
    logger?: ILogger;

    /**
     * True if the SDK was configured to be completely offline.
     */
    offline?: boolean;

    /**
     * The configured SDK key.
     */
    sdkKey: string;

    /**
     * Defines the base service URIs used by SDK components.
     */
    serviceEndpoints: ServiceEndpoints;

    /**
     * The interval in between flushes of events queue, in milliseconds.
     */
    flushInterval: number;

    /**
     * The max number of events in the events queue.
     */
    maxEventsInQueue: number;
}

/**
 * The client context provides basic configuration and platform support which are required
 * when building SDK components.
 */
export default class ClientContext implements IClientContext {
    basicConfiguration: IBasicConfiguration;

    constructor(
        sdkKey: string,
        configuration: {
            logger?: ILogger;
            offline?: boolean;
            flushInterval: number;
            maxEventsInQueue: number;
            serviceEndpoints: ServiceEndpoints;
        },
        public readonly platform: IPlatform,
    ) {
        this.basicConfiguration = {
            logger: configuration.logger,
            offline: configuration.offline,
            flushInterval: configuration.flushInterval,
            maxEventsInQueue: configuration.maxEventsInQueue,
            serviceEndpoints: configuration.serviceEndpoints,
            sdkKey,
        };
    }
}