import { IEventBuffer } from "./EventBuffer";
import { IEvent } from "./event";

export class DefaultEventBuffer implements IEventBuffer {
  private events: IEvent[];

  constructor(private readonly capacity: number) {
    this.events = [];
  }

  addEvent(event: IEvent): boolean {
    if (this.events.length >= this.capacity) {
      return false;
    }

    this.events.push(event);
    return true;
  }

  clear(): void {
    this.events = [];
  }

  get eventsSnapshot(): IEvent[] {
    return [...this.events];
  }

  get length(): number {
    return this.events.length;
  }

  get isEmpty(): boolean {
    return this.length === 0;
  }
}