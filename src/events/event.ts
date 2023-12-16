import {IFeatBitClient} from "../interfaces/FeatBitClient";

export interface IEvent {}

export class AsyncEvent implements IEvent {
    private isCompletedPromise?: Promise<AsyncEvent>;
    private resolveFn: (value: AsyncEvent) => void;
    private rejectFn?: () => void;

    constructor() {
        this.isCompletedPromise = new Promise<AsyncEvent>((resolve, reject) => {
            this.resolveFn = resolve;
            this.rejectFn = reject;
        });
    }

    async waitForCompletion() {
        return this.isCompletedPromise;
    }

    complete() {
        this.resolveFn?.(this);
    }
}

export class FlushEvent extends AsyncEvent {}

export class ShutdownEvent implements IEvent {}

export class PayloadEvent implements IEvent {}

export class EvalEvent extends PayloadEvent {

}