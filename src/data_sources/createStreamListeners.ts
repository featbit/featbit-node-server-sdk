import { IDataSourceUpdates } from "../subsystems/DataSourceUpdates";
import { ILogger } from "../logging/Logger";
import { VoidFunction } from "../utils/VoidFunction";
import {
    IAllData,
    deserializeAll,
    deserializePatch,
    IPatchData,
    deserializeDelete,
    IDeleteData, FlagsAndSegments
} from "../store/serialization";
import VersionedDataKinds from "../store/VersionedDataKinds";
import { EventName, ProcessStreamResponse } from "../platform/IEventSource";
import { IFeatureStoreDataStorage } from "../subsystems/FeatureStore";

export const createPutListener = (
    dataSourceUpdates: IDataSourceUpdates,
    logger?: ILogger,
    onPutCompleteHandler: VoidFunction = () => {},
) => ({
    deserializeData: deserializeAll,
    processJson: async ({ flags, segments }: FlagsAndSegments) => {
        const initData: IFeatureStoreDataStorage = {
            [VersionedDataKinds.Features.namespace]: flags,
            [VersionedDataKinds.Segments.namespace]: segments,
        };

        logger?.debug('Initializing all data', initData);
        dataSourceUpdates.init(initData, onPutCompleteHandler);
    },
});

export const createPatchListener = (
    dataSourceUpdates: IDataSourceUpdates,
    logger?: ILogger,
    onPatchCompleteHandler: VoidFunction = () => {},
) => ({
    deserializeData: deserializePatch,
    processJson: async ({ data, kind, path }: IPatchData) => {
        if (kind) {
            const key = VersionedDataKinds.getKeyFromPath(kind, path);
            if (key) {
                logger?.debug(`Updating ${key} in ${kind.namespace}`);
                dataSourceUpdates.upsert(kind, data, onPatchCompleteHandler);
            }
        }
    },
});

export const createDeleteListener = (
    dataSourceUpdates: IDataSourceUpdates,
    logger?: ILogger,
    onDeleteCompleteHandler: VoidFunction = () => {},
) => ({
    deserializeData: deserializeDelete,
    processJson: async ({ kind, path, version }: IDeleteData) => {
        if (kind) {
            const key = VersionedDataKinds.getKeyFromPath(kind, path);
            if (key) {
                logger?.debug(`Deleting ${key} in ${kind.namespace}`);
                dataSourceUpdates.upsert(
                    kind,
                    {
                        key,
                        version,
                        deleted: true,
                    },
                    onDeleteCompleteHandler,
                );
            }
        }
    },
});

export const createStreamListeners = (
    dataSourceUpdates: IDataSourceUpdates,
    logger?: ILogger,
    onCompleteHandlers?: {
        put?: VoidFunction;
        patch?: VoidFunction;
        delete?: VoidFunction;
    },
) => {
    const listeners = new Map<EventName, ProcessStreamResponse>();
    listeners.set('put', createPutListener(dataSourceUpdates, logger, onCompleteHandlers?.put));
    listeners.set('patch', createPatchListener(dataSourceUpdates, logger, onCompleteHandlers?.patch));
    listeners.set(
        'delete',
        createDeleteListener(dataSourceUpdates, logger, onCompleteHandlers?.delete),
    );
    return listeners;
};
