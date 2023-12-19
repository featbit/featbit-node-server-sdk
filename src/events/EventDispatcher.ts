import { ILogger } from "../logging/ILogger";
import ClientContext from "../options/ClientContext";
import {DeliveryStatus, IEventSender} from "./IEventSender";
import { IEventQueue } from "./IEventQueue";
import { DefaultEventQueue } from "./DefaultEventQueue";
import { DefaultEventSender } from "./DefaultEventSender";
import { AsyncEvent, FlushEvent, IEvent, PayloadEvent, ShutdownEvent } from "./event";
import {IEventSerializer} from "./EventSerializer";
import {DefaultEventSerializer} from "./DefaultEventSerializer";
import sleep from "../utils/sleep";

export class EventDispatcher {
  private logger: ILogger;
  private sender: IEventSender;
  private buffer: IEventQueue;
  private serializer: IEventSerializer;

  private maxEventPerRequest = 50;
  private stopped: boolean = false;

  constructor(clientContext: ClientContext, queue: IEventQueue) {
    const { logger, maxEventsInQueue } = clientContext;
    this.logger = logger!;

    this.buffer = new DefaultEventQueue(maxEventsInQueue, this.logger);
    this.sender = new DefaultEventSender(clientContext);
    this.serializer = new DefaultEventSerializer();

    this.dispatchLoop(queue);
  }

  private async dispatchLoop(queue: IEventQueue) {
    this.logger.debug('Start dispatch loop.');

    let running = true;
    while(running) {
      try {
        const event = queue.pop();

        if (event === undefined) {
          await sleep(1000);
          continue;
        }

        if (event instanceof PayloadEvent) {
          this.addEventToBuffer(event);
        } else if (event instanceof FlushEvent) {
          await this.triggerFlush(event);
        } else if (event instanceof ShutdownEvent) {
          this.stopped = true;
          await this.triggerFlush(event);
        }
      } catch (err) {
        this.logger.error('Unexpected error in event dispatcher.', err);
      }
    }

    this.logger.debug('Finish dispatch loop.');
  }

  private addEventToBuffer(event: IEvent) {
    if (this.stopped){
      return;
    }

    if (this.buffer.addEvent(event)) {
      this.logger.debug('Added event to buffer.');
    } else {
      this.logger.warn('Exceeded event queue capacity, event will be dropped. Increase capacity to avoid dropping events.');
    }
  }

  private async triggerFlush(event: AsyncEvent) {
    if (this.stopped) {
      event.complete();
      return;
    }

    if (this.buffer.isEmpty) {
      this.logger.debug('Flush empty buffer.');
      // There are no events to flush. If we don't complete the message, then the async task may never
      // complete (if it had a non-zero positive timeout, then it would complete after the timeout).
      event.complete();
      return;
    }

    const snapshot = this.buffer.eventsSnapshot;
    this.buffer.clear();
    try {
      await this.flushEvents(snapshot);
      this.logger.debug(`${snapshot.length} events has been flushed.`);
    } catch (err) {
      this.logger.warn('Exception happened when flushing events', err);
    }
  }

  private async flushEvents(events: IEvent[]) {
    const total = events.length;
    for(let i=0; i < total; i+= this.maxEventPerRequest) {
      const length = Math.min(this.maxEventPerRequest, total - i);
      const slice = events.slice(i,  i + length);
      const payload = this.serializer.serialize(slice);

      const { status } = await this.sender.send(payload);
      if (status === DeliveryStatus.FailedAndMustShutDown)
      {
        this.stopped = true;
      }
    }
  }
}