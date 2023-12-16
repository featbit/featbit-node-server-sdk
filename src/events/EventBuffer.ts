import { IEvent } from "./event";

export interface IEventBuffer {
  addEvent(event: IEvent): boolean;

  clear(): void;

  eventsSnapshot(): IEvent[];

  length(): number;

  isEmpty(): boolean;
}