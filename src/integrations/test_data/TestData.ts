import { IFlag } from "../../evaluation/data/IFlag";
import { ISegment } from "../../evaluation/data/ISegment";
import TestDataSynchronizer from "./TestDataSynchronizer";
import { IClientContext } from "../../options/IClientContext";
import { IDataSourceUpdates } from "../../store/IDataSourceUpdates";
import { VoidFunction } from "../../utils/VoidFunction";
import { createStreamListeners } from "../../data-sources/createStreamListeners";
import { IStore } from "../../store/store";
import DataKinds from "../../store/DataKinds";

export default class TestData {
  private currentFlags: IFlag[] = [];

  private currentSegments: ISegment[] = [];

  private dataSynchronizer: TestDataSynchronizer | undefined;

  private store: IStore = {} as IStore;

  /**
   * Get a factory for update processors that will be attached to this TestData instance.
   * @returns An update processor factory.
   */
  getFactory() {
    // Provides an arrow function to prevent needed to bind the method to
    // maintain `this`.
    return (
      clientContext: IClientContext,
      store: IStore,
      dataSourceUpdates: IDataSourceUpdates,
      initSuccessHandler: VoidFunction,
      _errorHandler?: (e: Error) => void,
    ) => {
      this.store = store;

      const listeners = createStreamListeners(
        dataSourceUpdates,
        clientContext.logger,
        {
          put: initSuccessHandler,
        },
      );

      this.dataSynchronizer = new TestDataSynchronizer(
        dataSourceUpdates,
        Object.values(this.currentFlags),
        Object.values(this.currentSegments),
        () => {},
        listeners,
      );

      return this.dataSynchronizer;
    }
  }

  update(flag: IFlag): Promise<void> {
    const oldVersion = this.store.get(DataKinds.Flags, flag.key)?.version || 0;
    const newFlag = { ...flag, version: oldVersion + 1 };

    return this.dataSynchronizer!.upsert(DataKinds.Flags, newFlag);
  }
}