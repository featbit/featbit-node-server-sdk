import { IEventProcessor } from "./IEventProcessor";
import {IEvent} from "./event";

export class NullEventProcessor implements IEventProcessor {
  flush(): Promise<void> {
    return Promise.resolve(undefined);
  }

  close(): void {
  }

  record(event: IEvent | null): boolean {
    return false;
  }
}