import { IBootstrapProvider } from "./IBootstrapProvider";
import { deserializeAll } from "../store/serialization";
import { IDataSourceUpdates } from "../store/IDataSourceUpdates";
import { IStoreDataStorage } from "../store/store";
import DataKinds from "../store/DataKinds";
import { isNullOrUndefined } from "../utils/isNullOrUndefined";

export class JsonBootstrapProvider implements IBootstrapProvider {
  private dataSet?: IStoreDataStorage;

  constructor(jsonStr: string) {
    const json = JSON.parse(jsonStr);
    if (!json) {
      throw new Error("Invalid JSON");
    }

    const {featureFlags, segments} = json.data;
    const data = deserializeAll(featureFlags, segments);
    this.dataSet = {
      [DataKinds.Flags.namespace]: data.flags,
      [DataKinds.Segments.namespace]: data.segments,
    };
  }

  populate(dataSourceUpdates: IDataSourceUpdates, callback?: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (isNullOrUndefined(this.dataSet)) {
        return resolve();
      }

      const internalCallback = () => {
        resolve();
        callback?.();
      }

      dataSourceUpdates.init(this.dataSet!, internalCallback);
    });
  }
}