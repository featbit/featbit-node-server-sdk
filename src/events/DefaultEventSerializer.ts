import {IEventSerializer} from "./EventSerializer";
import { EvalEvent, IEvent, PayloadEvent } from "./event";

export class DefaultEventSerializer implements IEventSerializer {
    serialize(events: IEvent[]): string {
        const payload = events
          .map(event => event instanceof EvalEvent || event instanceof PayloadEvent ? event.toPayload() : null)
          .filter(event => event !== null);

        return JSON.stringify(payload);
    }
}