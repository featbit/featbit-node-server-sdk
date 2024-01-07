import { IDataSynchronizer } from "../../data-sync/IDataSynchronizer";
import { IFlag } from "../../evaluation/data/IFlag";
import { ISegment } from "../../evaluation/data/ISegment";
import { EventName, ProcessStreamResponse } from "../../data-sync/types";
import { IDataSourceUpdates } from "../../store/IDataSourceUpdates";
import { VoidFunction } from "../../utils/VoidFunction";
import { IDataKind } from "../../IDataKind";
import { IKeyedStoreItem, IStore } from "../../store/store";

export default class TestDataSynchronizer implements IDataSynchronizer {
  private readonly flags: IFlag[];
  private readonly segments: ISegment[];

  constructor(
    private dataSourceUpdates: IDataSourceUpdates,
    initialFlags: IFlag[],
    initialSegments: ISegment[],
    private readonly onStop: VoidFunction,
    private readonly listeners: Map<EventName, ProcessStreamResponse>
  ) {
    // make copies of these objects to decouple them from the originals
    // so updates made to the originals don't affect these internal data.
    this.flags = [...initialFlags];
    this.segments = [...initialSegments];
  }

  async start() {
    this.listeners.forEach(({deserializeData, processJson }) => {
      const data = deserializeData(this.flags, this.segments);
      processJson(data);
    });
  }

  stop() {
    this.onStop();
  }

  close() {
    this.stop();
  }

  async upsert(kind: IDataKind, value: IKeyedStoreItem) {
    return new Promise<void>((resolve) => {
      this.dataSourceUpdates.upsert(kind, value, () => {
        resolve();
      });
    });
  }
}