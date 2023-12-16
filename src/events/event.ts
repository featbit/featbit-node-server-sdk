export interface IEvent {}

export class AsyncEvent implements IEvent {
    private isCompletedPromise?: Promise<AsyncEvent>;
    private resolveFn?: (value: AsyncEvent) => void;

    constructor() {
        this.isCompletedPromise = new Promise<AsyncEvent>((resolve) => {
            this.resolveFn = resolve;
        });
    }

    waitForCompletion(): Promise<AsyncEvent> {
        return this.isCompletedPromise!;
    }

    complete() {
        this.resolveFn?.(this);
    }
}

export class FlushEvent extends AsyncEvent {}

export class ShutdownEvent extends AsyncEvent {}

export class PayloadEvent implements IEvent {}

export class EvalEvent extends PayloadEvent {

}