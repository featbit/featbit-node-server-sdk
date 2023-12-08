import { IEventSource, IEventSourceInitDict } from "./IEventSource";
import { ILogger } from "../logging/Logger";
import * as https from "https";
import * as http from "http";
import { IResponse, IRequests, IRequestOptions } from "./IRequests";
import NodeResponse from "./NodeResponse";

function createAgent(
  isSecure: boolean
): https.Agent | http.Agent | undefined {
  const options: https.AgentOptions & { [index: string]: any } = {
    abc: "abc"
  };

  // Node does not take kindly to undefined keys.
  Object.keys(options).forEach((key) => {
    if (options[key] === undefined) {
      delete options[key];
    }
  });

  return new (isSecure ? https : http).Agent(options);
}

export default class NodeRequests implements IRequests {
  private agent: https.Agent | http.Agent | undefined;

  constructor(logger?: ILogger) {
  }

  fetch(url: string, options: IRequestOptions = {}): Promise<IResponse> {
    const isSecure = url.startsWith('https://');
    const agent = createAgent(isSecure);
    const impl = isSecure ? https : http;

    return new Promise((resolve, reject) => {
      const req = impl.request(
        url,
        {
          timeout: options.timeout,
          headers: options.headers,
          method: options.method,
          agent: this.agent,
        },
        (res) => resolve(new NodeResponse(res)),
      );

      if (options.body) {
        req.write(options.body);
      }

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    });
  }

  createEventSource(
    url: string,
    eventSourceInitDict: IEventSourceInitDict,
  ): IEventSource {
    return {} as IEventSource;
  }
}