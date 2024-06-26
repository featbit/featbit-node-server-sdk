import { IDataSourceUpdates } from "../store/IDataSourceUpdates";
import {
  IStore,
  IStoreDataStorage,
  IStoreItem,
  IKeyedStoreItem
} from "../store/store";
import { IDataKind } from "../IDataKind";
import NamespacedDataSet from "./NamespacedDataSet";
import DataKinds from "../store/DataKinds";
import DependencyTracker from "./DependencyTracker";
import { ICondition } from "../evaluation/data/ICondition";
import { isSegmentCondition } from "../evaluation/evalRules";

/**
 * This type allows computing the condition dependencies of either a flag or a segment.
 */
interface ITypeWithRuleConditions {
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
  const isFlag = namespace === DataKinds.Flags.namespace;
  const isSegment = namespace === DataKinds.Segments.namespace;

  if (isFlag || isSegment) {
    const itemWithRuleConditions = item as ITypeWithRuleConditions;

    itemWithRuleConditions?.rules?.forEach((rule) => {
      rule.conditions?.forEach((condition) => {
        if (isSegmentCondition(condition)) {
          const segmentIds: string[] = JSON.parse(condition.value);
          segmentIds?.forEach((segmentId) => {
            ret.set(DataKinds.Segments.namespace, segmentId, true);
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
    private readonly onChange: (keys: string[]) => void,
  ) {
  }

  init(allData: IStoreDataStorage, callback?: () => void): void {
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
      const oldFlags = this.store.all(DataKinds.Flags);
      const oldSegments = this.store.all(DataKinds.Segments);
      const oldData = {
        [DataKinds.Flags.namespace]: oldFlags,
        [DataKinds.Segments.namespace]: oldSegments,
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
    const updatedKeys: string[] = [];
    dataSet.enumerate((namespace, key) => {
      if (namespace === DataKinds.Flags.namespace) {
        updatedKeys.push(key);
      }
    });

    this.onChange(updatedKeys);
  }
}