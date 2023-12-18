import { IUser } from "../options/User";
import { IVariation } from "../evaluation/data/Variation";
import { isNullOrUndefined } from "../utils/isNullOrUndefined";

export interface IEvent {
}

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

export class FlushEvent extends AsyncEvent {
}

export class ShutdownEvent extends AsyncEvent {
}

export class PayloadEvent implements IEvent {
    toPayload(): any {};
}

export class CustomEvent extends PayloadEvent {
  timestamp: number;

  constructor(
    public user: IUser,
    public eventName: string,
    public appType: string,
    public metricValue?: number
  ) {
    super();
    this.timestamp = new Date().getTime();
  }

  toPayload(): any {
    return {
      user: this.user,
      metrics: [{
        route: '',
        timestamp: this.timestamp,
        numericValue: this.metricValue ?? 1,
        appType: this.appType,
        eventName: this.eventName,
        type: 'CustomEvent'
      }]
    }
  }
}

export class EvalEvent extends PayloadEvent {
  timestamp: number;

  constructor(
    public user: IUser,
    public flagKey: string,
    public variation: IVariation,
    public sendToExperiment: boolean
  ) {
    super();
    this.timestamp = new Date().getTime();
  }

  toPayload(): any {
    return {
      user: this.user,
      variations: [{
        featureFlagKey: this.flagKey,
        sendToExperiment: this.sendToExperiment,
        timestamp: this.timestamp,
        variation: this.variation
      }]
    }
  }
}