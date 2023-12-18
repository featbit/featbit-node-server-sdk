import { ILogger } from "../logging/ILogger";
import { IPlatform } from "../platform/IPlatform";

/**
 * Specifies the base service URIs used by SDK components.
 */
export interface IServiceEndpoints {
    // Properties are for internal SDK components.
}

/**
 * The most basic properties of the SDK client that are available to all SDK component factories.
 */
export interface IBasicConfiguration {
    /**
     * The configured SDK key.
     */
    sdkKey: string;

    /**
     * Defines the base service URIs used by SDK components.
     */
    serviceEndpoints: IServiceEndpoints;

    /**
     * True if the SDK was configured to be completely offline.
     */
    offline?: boolean;

    logger?: ILogger;
}

/**
 * Factory methods receive this class as a parameter.
 *
 * Its public properties provide information about the SDK configuration and environment. The SDK
 * may also include non-public properties that are relevant only when creating one of the built-in
 * component types and are not accessible to custom components.
 */
export interface IClientContext {
    /**
     * The SDK's basic global properties.
     */
    basicConfiguration: IBasicConfiguration;

    /**
     * Interfaces providing platform specific information and functionality.
     */
    platform: IPlatform;
}