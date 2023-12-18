import { IEvent } from "./event";

export interface IEventProcessor {
  close(): void;
  flush(): Promise<void>;
  record(event: IEvent | null): boolean;
}