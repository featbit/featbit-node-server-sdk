export interface IEventProcessor {
  close(): void;
  flush(): Promise<void>;
  record(): void;
}