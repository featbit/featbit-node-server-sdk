import { IDataSourceUpdates } from "../subsystems/DataSourceUpdates";
import {
    IStore,
    IStoreDataStorage,
    IStoreItem,
    IKeyedStoreItem
} from "../subsystems/Store";
import { IDataKind } from "../interfaces/DataKind";
import NamespacedDataSet from "./NamespacedDataSet";
import { IClause } from "../evaluation/data/Clause";
import { IFlag } from "../evaluation/data/Flag";
import VersionedDataKinds from "../store/VersionedDataKinds";
import DependencyTracker from "./DependencyTracker";

/**
 * This type allows computing the clause dependencies of either a flag or a segment.
 */
interface TypeWithRuleClauses {
    rules?: [
        {
            // The shape of rules are different between flags and segments, but
            // both have clauses of the same shape.
            clauses?: IClause[];
        },
    ];
}

function computeDependencies(namespace: string, item: IStoreItem) {
    const ret = new NamespacedDataSet<boolean>();
    const isFlag = namespace === VersionedDataKinds.Features.namespace;
    const isSegment = namespace === VersionedDataKinds.Segments.namespace;

    if (isFlag || isSegment) {
        const itemWithRuleClauses = item as TypeWithRuleClauses;

        itemWithRuleClauses?.rules?.forEach((rule) => {
            rule.clauses?.forEach((clause) => {
                if (clause.op === 'segmentMatch') {
                    clause.values.forEach((value) => {
                        ret.set(VersionedDataKinds.Segments.namespace, value, true);
                    });
                }
            });
        });
    }
    return ret;
}

/**
 * @internal
 */
export default class DataSourceUpdates implements IDataSourceUpdates {
    private readonly dependencyTracker = new DependencyTracker();

    constructor(
        private readonly store: IStore,
        private readonly hasEventListeners: () => boolean,
        private readonly onChange: (key: string) => void,
    ) {}

    init(allData: IStoreDataStorage, callback: () => void): void {
        const checkForChanges = this.hasEventListeners();
        const doInit = (oldData?: IStoreDataStorage) => {
            this.store.init(allData, () => {
                // Defer change events so they execute after the callback.
                Promise.resolve().then(() => {
                    this.dependencyTracker.reset();

                    Object.entries(allData).forEach(([namespace, items]) => {
                        Object.keys(items || {}).forEach((key) => {
                            const item = items[key];
                            this.dependencyTracker.updateDependenciesFrom(
                                namespace,
                                key,
                                computeDependencies(namespace, item),
                            );
                        });
                    });

                    if (checkForChanges) {
                        const updatedItems = new NamespacedDataSet<boolean>();
                        Object.keys(allData).forEach((namespace) => {
                            const oldDataForKind = oldData?.[namespace] || {};
                            const newDataForKind = allData[namespace];
                            const mergedData = { ...oldDataForKind, ...newDataForKind };
                            Object.keys(mergedData).forEach((key) => {
                                this.addIfModified(
                                    namespace,
                                    key,
                                    oldDataForKind && oldDataForKind[key],
                                    newDataForKind && newDataForKind[key],
                                    updatedItems,
                                );
                            });
                        });
                        this.sendChangeEvents(updatedItems);
                    }
                });
                callback?.();
            });
        };

        if (checkForChanges) {
            const oldFlags = this.store.all(VersionedDataKinds.Features);
            const oldSegments = this.store.all(VersionedDataKinds.Segments);
            const oldData = {
                [VersionedDataKinds.Features.namespace]: oldFlags,
                [VersionedDataKinds.Segments.namespace]: oldSegments,
            };
            doInit(oldData);
        } else {
            doInit();
        }
    }

    upsert(kind: IDataKind, data: IKeyedStoreItem, callback: () => void): void {
        const { key } = data;
        const checkForChanges = this.hasEventListeners();
        const doUpsert = (oldItem?: IStoreItem | null) => {
            this.store.upsert(kind, data, () => {
                // Defer change events so they execute after the callback.
                Promise.resolve().then(() => {
                    this.dependencyTracker.updateDependenciesFrom(
                        kind.namespace,
                        key,
                        computeDependencies(kind.namespace, data),
                    );
                    if (checkForChanges) {
                        const updatedItems = new NamespacedDataSet<boolean>();
                        this.addIfModified(kind.namespace, key, oldItem, data, updatedItems);
                        this.sendChangeEvents(updatedItems);
                    }
                });

                callback?.();
            });
        };
        if (checkForChanges) {
            const item = this.store.get(kind, key);
            doUpsert(item);
        } else {
            doUpsert();
        }
    }

    addIfModified(
        namespace: string,
        key: string,
        oldValue: IStoreItem | null | undefined,
        newValue: IStoreItem,
        toDataSet: NamespacedDataSet<boolean>,
    ) {
        if (newValue && oldValue && newValue.version <= oldValue.version) {
            return;
        }
        this.dependencyTracker.updateModifiedItems(toDataSet, namespace, key);
    }

    sendChangeEvents(dataSet: NamespacedDataSet<boolean>) {
        dataSet.enumerate((namespace, key) => {
            if (namespace === VersionedDataKinds.Features.namespace) {
                this.onChange(key);
            }
        });
    }
}