import { IEventProcessor } from "./EventProcessor";

export class NullEventProcessor implements IEventProcessor {
  flush(): Promise<void> {
    return Promise.resolve(undefined);
  }

  close(): void {
  }

  record(): void {
  }
}