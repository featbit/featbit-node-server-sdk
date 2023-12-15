import { IEventProcessor } from "./EventProcessor";

export class DefaultEventProcessor implements IEventProcessor {

  flush(): Promise<void> {
    return Promise.resolve(undefined);
  }

  close(): void {
  }

  record(): void {
  }
}