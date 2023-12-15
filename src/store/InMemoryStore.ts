import { IDataKind } from "../interfaces/DataKind";
import {
    IStore,
    IFeatureStoreDataStorage,
    IFeatureStoreItem,
    IFeatureStoreKindData, IKeyedFeatureStoreItem
} from "../subsystems/Store";
import VersionedDataKinds from "./VersionedDataKinds";

export default class InMemoryStore implements IStore {
    version: number = 0;

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

        if (item.version > this.version) {
            this.version = item.version;
        }
    }

    get(kind: IDataKind, key: string): IFeatureStoreItem | null {
        const items = this.allData[kind.namespace];
        if (items) {
            if (Object.prototype.hasOwnProperty.call(items, key)) {
                const item = items[key];
                if (item && !item.deleted) {
                    return item;
                }
            }
        }
        return null;
    }

    all(kind: IDataKind): IFeatureStoreKindData {
        const result: IFeatureStoreKindData = {};
        const items = this.allData[kind.namespace] ?? {};
        Object.entries(items).forEach(([key, item]) => {
            if (item && !item.deleted) {
                result[key] = item;
            }
        });

        return result;
    }

    init(allData: IFeatureStoreDataStorage, callback: () => void): void {
        this.allData = allData as IFeatureStoreDataStorage;

        this.version = 0;
        Object.keys(allData).map(namespace => {
            Object.entries(allData[namespace]).forEach(([_, item]) => {
                if (item.version > this.version) {
                    this.version = item.version;
                }
            })
        });

        this.initCalled = true;
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

    initialized(): boolean {
        return this.initCalled;
    }

    /* eslint-disable class-methods-use-this */
    close(): void {
        // For the memory store this is a no-op.
    }

    getDescription(): string {
        return 'memory';
    }
}