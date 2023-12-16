import { ILogger } from "../logging/Logger";
import ClientContext from "../options/ClientContext";
import {DeliveryStatus, IEventSender} from "./EventSender";
import { IEventBuffer } from "./EventBuffer";
import { DefaultEventBuffer } from "./DefaultEventBuffer";
import { DefaultEventSender } from "./DefaultEventSender";
import { FlushEvent, IEvent, PayloadEvent, ShutdownEvent } from "./event";
import {IEventSerializer} from "./EventSerializer";
import {DefaultEventSerializer} from "./DefaultEventSerializer";

export class EventDispatcher {
  private logger: ILogger;
  private sender: IEventSender;
  private buffer: IEventBuffer;
  private serializer: IEventSerializer;
  private flushInterval: number;

  private maxEventPerRequest = 50;
  private stopped: boolean = false;

  constructor(clientContext: ClientContext, queue: IEvent[]) {
    const { basicConfiguration } = clientContext;
    const { logger, maxEventsInQueue, flushInterval} = basicConfiguration;
    this.logger = logger!;
    this.flushInterval = flushInterval;

    this.buffer = new DefaultEventBuffer(maxEventsInQueue);
    this.sender = new DefaultEventSender(clientContext);
    this.serializer = new DefaultEventSerializer();

    this.dispatchLoop(queue);
  }

  private dispatchLoop(queue: IEvent[]) {
    this.logger.debug('Start dispatch loop.');

    try {
      const event = queue.pop();

      if (event instanceof PayloadEvent) {
        this.addEventToBuffer(event);

        setTimeout(() => this.dispatchLoop(queue), this.flushInterval);
      } else if (event instanceof FlushEvent) {
        this.triggerFlush(event);

        setTimeout(() => this.dispatchLoop(queue), this.flushInterval);
      } else if (event instanceof ShutdownEvent) {
        this.waitForFlush(event);
      }
    } catch (err) {
      this.logger.error('Unexpected error in event dispatcher.', err);
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

  private async triggerFlush(event: IEvent) {
    if (this.buffer.isEmpty) {
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

  private waitForFlush(event: IEvent) {

  }
}