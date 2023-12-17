import { IDataKind } from "../interfaces/DataKind";
import {
    IStore,
    IStoreDataStorage,
    IStoreItem,
    IStoreKindData, IKeyedStoreItem
} from "../subsystems/Store";
import VersionedDataKinds from "./VersionedDataKinds";

export default class InMemoryStore implements IStore {
    version: number = 0;

    private allData: IStoreDataStorage = {};

    private initCalled = false;

    private addItem(kind: IDataKind, key: string, item: IStoreItem) {
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

    get(kind: IDataKind, key: string): IStoreItem | null {
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

    all(kind: IDataKind): IStoreKindData {
        const result: IStoreKindData = {};
        const items = this.allData[kind.namespace] ?? {};
        Object.entries(items).forEach(([key, item]) => {
            if (item && !item.deleted) {
                result[key] = item;
            }
        });

        return result;
    }

    init(allData: IStoreDataStorage, callback: () => void): void {
        this.allData = allData as IStoreDataStorage;

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

    upsert(kind: IDataKind, data: IKeyedStoreItem, callback: () => void): void {
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