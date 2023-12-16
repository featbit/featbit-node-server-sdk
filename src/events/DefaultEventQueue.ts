import { IEventQueue } from "./EventQueue";
import { IEvent } from "./event";

export class DefaultEventQueue implements IEventQueue {
  private events: IEvent[];
  private closed: boolean = false;

  constructor(private readonly capacity: number) {
    this.events = [];
  }

  addEvent(event: IEvent): boolean {
    if (this.closed) {
      return false;
    }

    if (this.events.length >= this.capacity) {
      return false;
    }

    this.events.push(event);
    return true;
  }

  clear(): void {
    this.events = [];
  }

  pop(): IEvent | undefined {
    return this.events.pop();
  }

  close(): void {
    this.closed = true;
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