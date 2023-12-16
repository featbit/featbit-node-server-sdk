export interface IEvent {}

export class FlushEvent implements IEvent {}

export class ShutdownEvent implements IEvent {}

export class PayloadEvent implements IEvent {}

export class EvalEvent extends PayloadEvent {

}