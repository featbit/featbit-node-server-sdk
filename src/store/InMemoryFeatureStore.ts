import { IDataKind } from "../interfaces/DataKind";
import {
    IFeatureStore,
    IFeatureStoreDataStorage,
    IFeatureStoreItem,
    IFeatureStoreKindData, IKeyedFeatureStoreItem
} from "../subsystems/FeatureStore";

export default class InMemoryFeatureStore implements IFeatureStore {
    private allData: IFeatureStoreDataStorage = {};

    private initCalled = false;

    private addItem(kind: IDataKind, key: string, item: IFeatureStoreItem) {
        let items = this.allData[kind.namespace];
        if (!items) {
            items = {};
            this.allData[kind.namespace] = items;
        }
        if (Object.hasOwnProperty.call(items, key)) {
            const old = items[key];
            if (!old || old.version < item.version) {
                items[key] = item;
            }
        } else {
            items[key] = item;
        }
    }

    get(kind: IDataKind, key: string, callback: (res: IFeatureStoreItem | null) => void): void {
        const items = this.allData[kind.namespace];
        if (items) {
            if (Object.prototype.hasOwnProperty.call(items, key)) {
                const item = items[key];
                if (item && !item.deleted) {
                    return callback?.(item);
                }
            }
        }
        return callback?.(null);
    }

    all(kind: IDataKind, callback: (res: IFeatureStoreKindData) => void): void {
        const result: IFeatureStoreKindData = {};
        const items = this.allData[kind.namespace] ?? {};
        Object.entries(items).forEach(([key, item]) => {
            if (item && !item.deleted) {
                result[key] = item;
            }
        });
        callback?.(result);
    }

    init(allData: IFeatureStoreDataStorage, callback: () => void): void {
        this.initCalled = true;
        this.allData = allData as IFeatureStoreDataStorage;
        callback?.();
    }

    delete(kind: IDataKind, key: string, version: number, callback: () => void): void {
        const deletedItem = { version, deleted: true };
        this.addItem(kind, key, deletedItem);
        callback?.();
    }

    upsert(kind: IDataKind, data: IKeyedFeatureStoreItem, callback: () => void): void {
        this.addItem(kind, data.key, data);
        callback?.();
    }

    initialized(callback: (isInitialized: boolean) => void): void {
        return callback?.(this.initCalled);
    }

    /* eslint-disable class-methods-use-this */
    close(): void {
        // For the memory store this is a no-op.
    }

    getDescription(): string {
        return 'memory';
    }
}