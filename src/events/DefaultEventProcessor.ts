import { IEventProcessor } from "./EventProcessor";
import { EventDispatcher } from "./EventDispatcher";
import ClientContext from "../options/ClientContext";
import { FlushEvent, IEvent, ShutdownEvent } from "./event";
import { isNullOrUndefined } from "../utils/isNullOrUndefined";
import { IEventQueue } from "./EventQueue";
import { DefaultEventQueue } from "./DefaultEventQueue";
import { ILogger } from "../logging/Logger";

export class DefaultEventProcessor implements IEventProcessor {
  private readonly logger: ILogger;
  private readonly flushInterval: number;
  private readonly eventDispatcher: EventDispatcher;
  private readonly eventQueue: IEventQueue;
  private closed: boolean = false;

  constructor(clientContext: ClientContext) {
    const { logger, flushInterval, maxEventsInQueue } = clientContext.basicConfiguration;
    this.logger = logger!;
    this.flushInterval = flushInterval;
    this.eventQueue = new DefaultEventQueue(maxEventsInQueue, this.logger);
    this.eventDispatcher = new EventDispatcher(clientContext, this.eventQueue);

    this.start();
  }

  private start() {
    if (this.closed) {
      return;
    }

    setTimeout(() => this.record(new FlushEvent()), this.flushInterval);
  }

  flush(): Promise<any> {
    const flushEvent = new FlushEvent();
    this.record(flushEvent);
    return flushEvent.waitForCompletion();
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.record(new FlushEvent());

    // send a shutdown event to dispatcher
    const shutdown = new ShutdownEvent();
    this.record(shutdown);

    try {
      await shutdown.waitForCompletion();
    } catch (err) {
      this.logger.error('Event processor shutdown but not complete.');
    }

    // mark the event queue as complete for adding
    this.eventQueue.close();
    this.closed = true;
  }

  record(event: IEvent | null): boolean {
    if (isNullOrUndefined(event)) {
      return false;
    }

    if (!this.eventQueue.addEvent(event!)) {
      if (event instanceof FlushEvent) {
        event.complete();
      }

      return false;
    }

    return true;
  }
}