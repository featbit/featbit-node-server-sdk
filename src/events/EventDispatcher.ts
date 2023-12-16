import { ILogger } from "../logging/Logger";
import ClientContext from "../options/ClientContext";
import { IEventSender } from "./EventSender";
import { IEventBuffer } from "./EventBuffer";
import { DefaultEventBuffer } from "./DefaultEventBuffer";
import { DefaultEventSender } from "./DefaultEventSender";
import { FlushEvent, IEvent, PayloadEvent, ShutdownEvent } from "./event";

export class EventDispatcher {
  private logger: ILogger;
  private sender: IEventSender;
  private buffer: IEventBuffer;
  private stoped: boolean;
  private flushInterval: number;

  constructor(clientContext: ClientContext, queue: IEvent[]) {
    const { basicConfiguration } = clientContext;
    this.logger = basicConfiguration.logger!;
    this.flushInterval = basicConfiguration.flushInterval;

    this.buffer = new DefaultEventBuffer();
    this.sender = new DefaultEventSender(clientContext);

    this.stoped = false;
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
    if (this.stoped){
      return;
    }

    if (this.buffer.addEvent(event)) {
      this.logger.debug('Added event to buffer.');
    } else {
      this.logger.warn('Exceeded event queue capacity, event will be dropped. Increase capacity to avoid dropping events.');
    }
  }

  private triggerFlush(event: IEvent) {

  }

  private waitForFlush(event: IEvent) {

  }
}