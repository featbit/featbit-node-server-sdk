import { IOptions } from "./options/Options";
import { ILogger } from "./logging/Logger";
import { ValidatedOptions } from "./options/ValidatedOptions";
import { NumberWithMinimum, TypeValidator, TypeValidators } from "./options/Validators";
import OptionMessages from "./options/OptionMessages";
import ServiceEndpoints from "./options/ServiceEndpoints";
import { IStore } from "./store/Store";
import { IClientContext } from "./interfaces/ClientContext";
import { IDataSynchronizer } from "./streaming/DataSynchronizer";
import { IDataSourceUpdates } from "./store/DataSourceUpdates";
import InMemoryStore from "./store/InMemoryStore";
import { VoidFunction } from "./utils/VoidFunction";
import { isNullOrUndefined } from "./utils/isNullOrUndefined";

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
    pollingUri: TypeValidators.String,
    streamingUri: TypeValidators.String,
    eventsUri: TypeValidators.String,
    webSocketHandshakeTimeout: TypeValidators.Number,
    webSocketPingInterval: TypeValidators.Number,
    logger: TypeValidators.Object,
    store: TypeValidators.ObjectOrFactory,
    updateProcessor: TypeValidators.ObjectOrFactory,
    flushInterval: TypeValidators.Number,
    maxEventsInQueue: TypeValidators.Number,
    pollInterval: TypeValidators.Number,
    offline: TypeValidators.Boolean,
    stream: TypeValidators.Boolean
};

/**
 * @internal
 */
export const defaultValues: ValidatedOptions = {
    sdkKey: '',
    pollingUri: '',
    streamingUri: '',
    eventsUri: '',
    stream: true,
    sendEvents: true,
    webSocketHandshakeTimeout: undefined,
    webSocketPingInterval: 18 * 1000,
    flushInterval: 2000,
    maxEventsInQueue: 10000,
    pollInterval: 30000,
    offline: false,
    store: () => new InMemoryStore(),
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
    const { streamingUri, pollingUri, eventsUri } = options;
    const streamingUriMissing = isNullOrUndefined(streamingUri);
    const pollingUriMissing = isNullOrUndefined(pollingUri);
    const eventsUriMissing = isNullOrUndefined(eventsUri);

    if (!validatedOptions.offline && (eventsUriMissing || (streamingUriMissing && pollingUriMissing))) {
        if (eventsUriMissing) {
            validatedOptions.logger?.warn(OptionMessages.partialEndpoint('eventsUri'));
        }

        if (options.stream && streamingUriMissing) {
            validatedOptions.logger?.warn(OptionMessages.partialEndpoint('streamingUri'));
        }

        if (!options.stream && pollingUriMissing) {
            validatedOptions.logger?.warn(OptionMessages.partialEndpoint('pollingUri'));
        }
    }
}

export default class Configuration {
    public readonly sdkKey: string;

    public readonly serviceEndpoints: ServiceEndpoints;

    public readonly webSocketHandshakeTimeout?: number;

    public readonly webSocketPingInterval: number;

    public readonly logger?: ILogger;

    public readonly flushInterval: number;

    public readonly maxEventsInQueue: number;

    public readonly pollInterval: number;

    public readonly offline: boolean;

    public readonly stream: boolean;

    public readonly storeFactory: (clientContext: IClientContext) => IStore;

    public readonly dataSynchronizerFactory?: (
        clientContext: IClientContext,
        dataSourceUpdates: IDataSourceUpdates,
        initSuccessHandler: VoidFunction,
        errorHandler?: (e: Error) => void,
    ) => IDataSynchronizer;

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
          validatedOptions.streamingUri,
          validatedOptions.pollingUri,
          validatedOptions.eventsUri
        );

        this.sdkKey = validatedOptions.sdkKey;
        this.webSocketHandshakeTimeout = validatedOptions.webSocketHandshakeTimeout;
        this.webSocketPingInterval = validatedOptions.webSocketPingInterval!;

        this.flushInterval = validatedOptions.flushInterval;
        this.maxEventsInQueue = validatedOptions.maxEventsInQueue;
        this.pollInterval = validatedOptions.pollInterval;

        this.offline = validatedOptions.offline;
        this.stream = validatedOptions.stream;

        if (TypeValidators.Function.is(validatedOptions.dataSynchronizer)) {
            // @ts-ignore
            this.dataSynchronizerFactory = validatedOptions.dataSynchronizer;
        } else {
            // The processor is already created, just have the method return it.
            // @ts-ignore
            this.dataSynchronizerFactory = () => validatedOptions.dataSynchronizer;
        }

        if (TypeValidators.Function.is(validatedOptions.store)) {
            // @ts-ignore
            this.storeFactory = validatedOptions.store;
        } else {
            // The store is already created, just have the method return it.
            // @ts-ignore
            this.storeFactory = () => validatedOptions.store;
        }
    }
}