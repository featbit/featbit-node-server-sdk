import { IEvent } from "./event";

export interface IEventQueue {
  addEvent(event: IEvent): boolean;

  clear(): void;

  pop(): IEvent | undefined;

  close(): void;

  get eventsSnapshot(): IEvent[];

  get length(): number;

  get isEmpty(): boolean;
}