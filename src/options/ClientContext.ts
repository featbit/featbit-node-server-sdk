import { ILogger } from "../logging/Logger";
import { IClientContext } from "../interfaces/ClientContext";
import { IPlatform } from "../platform/Platform";
import ServiceEndpoints from "./ServiceEndpoints";

/**
 * Basic configuration applicable to many SDK components for both server and
 * client SDKs.
 */
interface BasicConfiguration {
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
     * Sets the initial reconnect delay for the streaming connection, in seconds.
     */
    streamInitialReconnectDelay?: number;
}

/**
 * The client context provides basic configuration and platform support which are required
 * when building SDK components.
 */
export default class ClientContext implements IClientContext {
    basicConfiguration: BasicConfiguration;

    constructor(
        sdkKey: string,
        configuration: {
            logger?: ILogger;
            offline?: boolean;
            serviceEndpoints: ServiceEndpoints;
        },
        public readonly platform: IPlatform,
    ) {
        this.basicConfiguration = {
            logger: configuration.logger,
            offline: configuration.offline,
            serviceEndpoints: configuration.serviceEndpoints,
            sdkKey,
        };
    }
}