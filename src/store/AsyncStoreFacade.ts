import {
    IFeatureStore,
    IFeatureStoreDataStorage,
    IFeatureStoreItem,
    IFeatureStoreKindData, IKeyedFeatureStoreItem
} from "../subsystems/FeatureStore";
import {IDataKind} from "../interfaces/DataKind";
import promisify from "../async/promisify";

/**
 * Provides an async interface to a feature store.
 *
 * This allows for using a store using async/await instead of callbacks.
 *
 */
export default class AsyncStoreFacade {
    private store: IFeatureStore;

    constructor(store: IFeatureStore) {
        this.store = store;
    }

    async get(kind: IDataKind, key: string): Promise<IFeatureStoreItem | null> {
        return promisify((cb) => {
            this.store.get(kind, key, cb);
        });
    }

    async all(kind: IDataKind): Promise<IFeatureStoreKindData> {
        return promisify((cb) => {
            this.store.all(kind, cb);
        });
    }

    async init(allData: IFeatureStoreDataStorage): Promise<void> {
        return promisify((cb) => {
            this.store.init(allData, cb);
        });
    }

    async delete(kind: IDataKind, key: string, version: number): Promise<void> {
        return promisify((cb) => {
            this.store.delete(kind, key, version, cb);
        });
    }

    async upsert(kind: IDataKind, data: IKeyedFeatureStoreItem): Promise<void> {
        return promisify((cb) => {
            this.store.upsert(kind, data, cb);
        });
    }

    async initialized(): Promise<boolean> {
        return promisify((cb) => {
            this.store.initialized(cb);
        });
    }

    close(): void {
        this.store.close();
    }
}