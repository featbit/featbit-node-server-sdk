import { IUser } from "../options/IUser";
import { IVariation } from "../evaluation/data/IVariation";

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
  toPayload(): any {
  };
}

export class MetricEvent extends PayloadEvent {
  timestamp: number;

  constructor(
    public user: IUser,
    public eventName: string,
    public appType: string,
    public metricValue: number
  ) {
    super();
    this.timestamp = new Date().getTime();
  }

  private userPayload() {
    return {
      keyId: this.user.key,
      name: this.user.name,
      customizedProperties: this.user.customizedProperties
    }
  }

  toPayload(): any {
    return {
      user: this.userPayload(),
      metrics: [{
        route: 'index/metric',
        timestamp: this.timestamp,
        numericValue: this.metricValue,
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

  private userPayload() {
    return {
      keyId: this.user.key,
      name: this.user.name,
      customizedProperties: this.user.customizedProperties
    }
  }

  toPayload(): any {
    return {
      user: this.userPayload(),
      variations: [{
        featureFlagKey: this.flagKey,
        sendToExperiment: this.sendToExperiment,
        timestamp: this.timestamp,
        variation: this.variation
      }]
    }
  }
}