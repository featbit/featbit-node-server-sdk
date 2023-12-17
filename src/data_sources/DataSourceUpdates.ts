import { IDataSourceUpdates } from "../store/DataSourceUpdates";
import {
  IStore,
  IStoreDataStorage,
  IStoreItem,
  IKeyedStoreItem
} from "../store/Store";
import { IDataKind } from "../interfaces/DataKind";
import NamespacedDataSet from "./NamespacedDataSet";
import VersionedDataKinds from "../store/VersionedDataKinds";
import DependencyTracker from "./DependencyTracker";
import { ICondition } from "../evaluation/data/Condition";
import { isSegmentCondition } from "../evaluation/evalRules";

/**
 * This type allows computing the condition dependencies of either a flag or a segment.
 */
interface TypeWithRuleConditions {
  rules?: [
    {
      // The shape of rules are different between flags and segments, but
      // both have conditions of the same shape.
      conditions?: ICondition[];
    },
  ];
}

function computeDependencies(namespace: string, item: IStoreItem) {
  const ret = new NamespacedDataSet<boolean>();
  const isFlag = namespace === VersionedDataKinds.Flags.namespace;
  const isSegment = namespace === VersionedDataKinds.Segments.namespace;

  if (isFlag || isSegment) {
    const itemWithRuleConditions = item as TypeWithRuleConditions;

    itemWithRuleConditions?.rules?.forEach((rule) => {
      rule.conditions?.forEach((condition) => {
        if (isSegmentCondition(condition)) {
          const segmentIds: string[] = JSON.parse(condition.value);
          segmentIds?.forEach((segmentId) => {
            ret.set(VersionedDataKinds.Segments.namespace, segmentId, true);
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
  ) {
  }

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
              const mergedData = {...oldDataForKind, ...newDataForKind};
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
      const oldFlags = this.store.all(VersionedDataKinds.Flags);
      const oldSegments = this.store.all(VersionedDataKinds.Segments);
      const oldData = {
        [VersionedDataKinds.Flags.namespace]: oldFlags,
        [VersionedDataKinds.Segments.namespace]: oldSegments,
      };
      doInit(oldData);
    } else {
      doInit();
    }
  }

  upsert(kind: IDataKind, data: IKeyedStoreItem, callback: () => void): void {
    const {key} = data;
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
      if (namespace === VersionedDataKinds.Flags.namespace) {
        this.onChange(key);
      }
    });
  }
}