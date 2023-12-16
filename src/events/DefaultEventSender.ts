import { DeliveryStatus, IEventSender, IEventSenderResult } from "./EventSender";
import ClientContext from "../options/ClientContext";
import { defaultHeaders, httpErrorMessage } from "../utils/http";
import { IRequests } from "../platform/IRequests";
import { isHttpRecoverable, UnexpectedResponseError } from "../errors";
import sleep from "../utils/sleep";

export class DefaultEventSender implements IEventSender {
  private defaultHeaders: {
    [key: string]: string;
  };
  private eventsUri: string;
  private requests: IRequests;

  constructor(clientContext: ClientContext) {
    const { basicConfiguration, platform } = clientContext;
    const {
      sdkKey,
      serviceEndpoints: {
        events
      },
    } = basicConfiguration;
    const { info, requests } = platform;
    this.defaultHeaders = defaultHeaders(sdkKey, info);
    this.eventsUri = events;
    this.requests = requests;
  }

  async send(payload: any): Promise<IEventSenderResult> {
    const res: IEventSenderResult = {
      status: DeliveryStatus.Succeeded,
    };

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'content-type': 'application/json',
    }

    let error;
    try {
      const { status } = await this.requests.fetch(this.eventsUri, {
        headers,
        body: JSON.stringify(payload),
        method: 'POST',
      });

      if (status <= 204) {
        return res;
      }

      error = new UnexpectedResponseError(
        httpErrorMessage({ status, message: 'some events were dropped' }, 'event posting'),
      );

      if (!isHttpRecoverable(status)) {
        res.status = DeliveryStatus.FailedAndMustShutDown;
        res.error = error;
        return res;
      }
    } catch (err) {
      res.status = DeliveryStatus.Failed;
      res.error = err;
      return res;
    }

    // wait 1 second before retrying
    await sleep();

    return this.send(payload);
  }
}