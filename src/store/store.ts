import { IDataKind } from "../IDataKind";

/**
 * Represents an item which can be stored in the feature store.
 */
export interface IStoreItem {
  version: number;

  // The actual data associated with the item.
  [attribute: string]: any;
}

/**
 * When upserting an item it must contain a key.
 */
export interface IKeyedStoreItem extends IStoreItem {
  key: string;
}

/**
 * Represents the storage for a single kind of data. e.g. 'flag' or 'segment'.
 */
export interface IStoreKindData {
  [key: string]: IStoreItem;
}

/**
 * Represents the storage for the full data store.
 */
export interface IStoreDataStorage {
  [namespace: string]: IStoreKindData;
}

/**
 * Interface for a feature store component.
 *
 * The feature store is what the client uses to store feature flag data that has been received
 * from FeatBit. By default, it uses an in-memory implementation; database integrations are
 * also available. Read the [SDK features guide](xxx).
 * You will not need to use this interface unless you are writing your own implementation.
 *
 * Feature store methods can and should call their callbacks directly whenever possible, rather
 * than deferring them with setImmediate() or process.nextTick(). This means that if for any
 * reason you are updating or querying a feature store directly in your application code (which
 * is not part of normal use of the SDK) you should be aware that the callback may be executed
 * immediately.
 */
export interface IStore {
  /**
   * Get an entity from the store.
   *
   * The store should treat any entity with the property `deleted: true` as "not found".
   *
   * @param kind
   *   The type of data to be accessed. The store should not make any assumptions about the format
   *   of the data, but just return a JSON object. The actual type of this parameter is
   *   {@link DataKind}.
   *
   * @param key
   *   The unique key of the entity within the specified collection.
   */
  get(kind: IDataKind, key: string): IStoreItem | null

  /**
   * Get all entities from a collection.
   *
   * The store should filter out any entities with the property `deleted: true`.
   *
   * @param kind
   *   The type of data to be accessed. The store should not make any assumptions about the format
   *   of the data, but just return an object in which each key is the `key` property of an entity
   *   and the value is the entity. The actual type of this parameter is
   *   {@link IDataKind}.
   */
  all(kind: IDataKind): IStoreKindData;

  /**
   * Initialize the store, overwriting any existing data.
   *
   * @param allData
   *   An object in which each key is the "namespace" of a collection (e.g. `"features"`) and
   *   the value is an object that maps keys to entities. The actual type of this parameter is
   *   `interfaces.FullDataSet<VersionedData>`.
   *
   * @param callback
   *   Will be called when the store has been initialized.
   */
  init(allData: IStoreDataStorage, callback: () => void): void;

  /**
   * Add an entity or update an existing entity.
   *
   * @param kind
   *   The type of data to be accessed. The actual type of this parameter is
   *   {@link IDataKind}.
   *
   * @param data
   *   The contents of the entity, as an object that can be converted to JSON. The store
   *   should check the `version` property of this object, and should *not* overwrite any
   *   existing data if the existing `version` is greater than or equal to that value.
   *   The actual type of this parameter is {@link IKeyedStoreItem}.
   *
   * @param callback
   *   Will be called after the upsert operation is complete.
   */
  upsert(kind: IDataKind, data: IKeyedStoreItem, callback: () => void): void;

  /**
   * Tests whether the store is initialized.
   *
   * "Initialized" means that the store has been populated with data, either by the client
   * having called `init()` within this process, or by another process (if this is a shared
   * database).
   *
   * @param callback
   *   Will be called back with the boolean result.
   */
  initialized(): boolean;

  /**
   * Releases any resources being used by the feature store.
   */
  close(): void;

  /**
   * Get a description of the store.
   */
  getDescription?(): string;


  /**
   * The latest version of the feature flags and segments.
   */
  version: number;
}