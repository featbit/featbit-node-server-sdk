import { IDataSynchronizer } from "./DataSynchronizer";

export class NullDataSynchronizer implements IDataSynchronizer {
  close(): void {
  }

  start(): void {
  }

  stop(): void {
  }
}