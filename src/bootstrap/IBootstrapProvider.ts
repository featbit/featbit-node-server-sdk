import { IDataSourceUpdates } from "../store/IDataSourceUpdates";

export interface IBootstrapProvider {
  populate(dataSourceUpdates: IDataSourceUpdates, callback?: () => void): Promise<void>
}