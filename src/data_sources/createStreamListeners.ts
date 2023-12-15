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
import VersionedDataKinds, { IVersionedDataKind } from "../store/VersionedDataKinds";
import { EventName, ProcessStreamResponse } from "../platform/IEventSource";
import { IFeatureStoreDataStorage } from "../subsystems/FeatureStore";
import { IFlag } from "../evaluation/data/Flag";
import { ISegment } from "../evaluation/data/Segment";
import { getTimestampFromDateTimeString } from "../streaming/utils";

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
    processJson: async (data: IPatchData[]) => {
        data?.forEach(item => {
            logger?.debug(`Updating ${item.data.key} in ${VersionedDataKinds.Features.namespace}`);
            dataSourceUpdates.upsert(item.kind, item.data, onPatchCompleteHandler);
        })
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
    return listeners;
};
