import { IEvent } from "./event";

export interface IEventBuffer {
  addEvent(event: IEvent): boolean;

  clear(): void;

  get eventsSnapshot(): IEvent[];

  get length(): number;

  get isEmpty(): boolean;
}