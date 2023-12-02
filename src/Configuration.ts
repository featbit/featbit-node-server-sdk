import { IOptions } from "./interfaces/Options";
import { ILogger } from "./logging/Logger";
import { ValidatedOptions } from "./ValidatedOptions";
import { NumberWithMinimum, TypeValidator, TypeValidators } from "./Validators";
import OptionMessages from "./options/OptionMessages";
import ServiceEndpoints from "./options/ServiceEndpoints";
import { IFeatureStore } from "./subsystems/FeatureStore";
import { IClientContext } from "./interfaces/ClientContext";
import { IStreamProcessor } from "./streaming/StreamProcessor";
import { IDataSourceUpdates } from "./subsystems/DataSourceUpdates";
import InMemoryFeatureStore from "./store/InMemoryFeatureStore";
import { VoidFunction } from "./utils/VoidFunction";

// Once things are internal to the implementation of the SDK we can depend on
// types. Calls to the SDK could contain anything without any regard to typing.
// So, data we take from external sources must be normalized into something
// that can be trusted.

/**
 * These perform cursory validations. Complex objects are implemented with classes
 * and these should allow for conditional construction.
 */
const validations: Record<string, TypeValidator> = {
    sdkKey: TypeValidators.String,
    baseUri: TypeValidators.String,
    streamUri: TypeValidators.String,
    eventsUri: TypeValidators.String,
    timeout: TypeValidators.Number,
    capacity: TypeValidators.Number,
    logger: TypeValidators.Object,
    featureStore: TypeValidators.ObjectOrFactory,
    bigSegments: TypeValidators.Object,
    updateProcessor: TypeValidators.ObjectOrFactory,
    flushInterval: TypeValidators.Number,
    pollInterval: TypeValidators.numberWithMin(30),
    proxyOptions: TypeValidators.Object,
    offline: TypeValidators.Boolean,
    stream: TypeValidators.Boolean,
    streamInitialReconnectDelay: TypeValidators.Number,
    useLdd: TypeValidators.Boolean,
    sendEvents: TypeValidators.Boolean,
    allAttributesPrivate: TypeValidators.Boolean,
    privateAttributes: TypeValidators.StringArray,
    contextKeysCapacity: TypeValidators.Number,
    contextKeysFlushInterval: TypeValidators.Number,
    tlsParams: TypeValidators.Object,
    diagnosticOptOut: TypeValidators.Boolean,
    diagnosticRecordingInterval: TypeValidators.numberWithMin(60),
    wrapperName: TypeValidators.String,
    wrapperVersion: TypeValidators.String,
    application: TypeValidators.Object,
};

/**
 * @internal
 */
export const defaultValues: ValidatedOptions = {
    sdkKey: '',
    baseUri: '',
    streamUri: '',
    eventsUri: '',
    stream: true,
    streamInitialReconnectDelay: 1,
    sendEvents: true,
    timeout: 5,
    capacity: 10000,
    flushInterval: 5,
    pollInterval: 30,
    offline: false,
    useLdd: false,
    allAttributesPrivate: false,
    privateAttributes: [],
    contextKeysCapacity: 1000,
    contextKeysFlushInterval: 300,
    diagnosticOptOut: false,
    diagnosticRecordingInterval: 900,
    featureStore: () => new InMemoryFeatureStore(),
};

function validateTypesAndNames(options: IOptions): {
    errors: string[];
    validatedOptions: ValidatedOptions;
} {
    const errors: string[] = [];
    const validatedOptions: ValidatedOptions = { ...defaultValues };
    Object.keys(options).forEach((optionName) => {
        // We need to tell typescript it doesn't actually know what options are.
        // If we don't then it complains we are doing crazy things with it.
        const optionValue = (options as unknown as any)[optionName];
        const validator = validations[optionName];
        if (validator) {
            if (!validator.is(optionValue)) {
                if (validator.getType() === 'boolean') {
                    errors.push(OptionMessages.wrongOptionTypeBoolean(optionName, typeof optionValue));
                    validatedOptions[optionName] = !!optionValue;
                } else if (
                    validator instanceof NumberWithMinimum &&
                    TypeValidators.Number.is(optionValue)
                ) {
                    const { min } = validator as NumberWithMinimum;
                    errors.push(OptionMessages.optionBelowMinimum(optionName, optionValue, min));
                    validatedOptions[optionName] = min;
                } else {
                    errors.push(
                        OptionMessages.wrongOptionType(optionName, validator.getType(), typeof optionValue),
                    );
                    validatedOptions[optionName] = defaultValues[optionName];
                }
            } else {
                validatedOptions[optionName] = optionValue;
            }
        } else {
            options.logger?.warn(OptionMessages.unknownOption(optionName));
        }
    });
    return { errors, validatedOptions };
}

function validateEndpoints(options: IOptions, validatedOptions: ValidatedOptions) {
    const { baseUri, streamUri, eventsUri } = options;
    const streamingEndpointSpecified = streamUri !== undefined && streamUri !== null;
    const pollingEndpointSpecified = baseUri !== undefined && baseUri !== null;
    const eventEndpointSpecified = eventsUri !== undefined && eventsUri !== null;

    if (
        streamingEndpointSpecified === pollingEndpointSpecified &&
        streamingEndpointSpecified === eventEndpointSpecified
    ) {
        // Either everything is default, or everything is set.
        return;
    }

    if (!streamingEndpointSpecified && validatedOptions.stream) {
        validatedOptions.logger?.warn(OptionMessages.partialEndpoint('streamUri'));
    }

    if (!pollingEndpointSpecified) {
        validatedOptions.logger?.warn(OptionMessages.partialEndpoint('baseUri'));
    }

    if (!eventEndpointSpecified && validatedOptions.sendEvents) {
        validatedOptions.logger?.warn(OptionMessages.partialEndpoint('eventsUri'));
    }
}

export default class Configuration {
    public readonly sdkKey: string;

    public readonly serviceEndpoints: ServiceEndpoints;

    public readonly eventsCapacity: number;

    public readonly timeout: number;

    public readonly logger?: ILogger;

    public readonly flushInterval: number;

    public readonly pollInterval: number;

    public readonly offline: boolean;

    public readonly stream: boolean;

    public readonly streamInitialReconnectDelay: number;

    public readonly featureStoreFactory: (clientContext: IClientContext) => IFeatureStore;

    public readonly updateProcessorFactory?: (
        clientContext: IClientContext,
        dataSourceUpdates: IDataSourceUpdates,
        initSuccessHandler: VoidFunction,
        errorHandler?: (e: Error) => void,
    ) => IStreamProcessor;

    constructor(options: IOptions = {}) {
        // The default will handle undefined, but not null.
        // Because we can be called from JS we need to be extra defensive.
        options = options || {};
        // If there isn't a valid logger from the platform, then logs would go nowhere.
        this.logger = options.logger;

        const { errors, validatedOptions } = validateTypesAndNames(options);
        errors.forEach((error) => {
            this.logger?.warn(error);
        });

        validateEndpoints(options, validatedOptions);

        this.serviceEndpoints = new ServiceEndpoints(
            validatedOptions.streamUri,
            validatedOptions.baseUri,
            validatedOptions.eventsUri
        );

        this.sdkKey = validatedOptions.sdkKey;
        this.eventsCapacity = validatedOptions.capacity;
        this.timeout = validatedOptions.timeout;

        this.flushInterval = validatedOptions.flushInterval;
        this.pollInterval = validatedOptions.pollInterval;

        this.offline = validatedOptions.offline;
        this.stream = validatedOptions.stream;
        this.streamInitialReconnectDelay = validatedOptions.streamInitialReconnectDelay;

        if (TypeValidators.Function.is(validatedOptions.updateProcessor)) {
            // @ts-ignore
            this.updateProcessorFactory = validatedOptions.updateProcessor;
        } else {
            // The processor is already created, just have the method return it.
            // @ts-ignore
            this.updateProcessorFactory = () => validatedOptions.updateProcessor;
        }

        if (TypeValidators.Function.is(validatedOptions.featureStore)) {
            // @ts-ignore
            this.featureStoreFactory = validatedOptions.featureStore;
        } else {
            // The store is already created, just have the method return it.
            // @ts-ignore
            this.featureStoreFactory = () => validatedOptions.featureStore;
        }
    }
}