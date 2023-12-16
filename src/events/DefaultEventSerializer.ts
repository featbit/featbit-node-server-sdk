import {IEventSerializer} from "./EventSerializer";
import {IEvent} from "./event";

export class DefaultEventSerializer implements IEventSerializer {
    serialize(events: IEvent[]): string {
        return "";
    }

}