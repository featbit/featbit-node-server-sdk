import * as https from "https";
import * as http from "http";
import { IResponse, IRequests, IRequestOptions } from "../requests";
import NodeResponse from "./NodeResponse";

export default class NodeRequests implements IRequests {

  constructor() {
  }

  fetch(url: string, options: IRequestOptions = {}): Promise<IResponse> {
    const isSecure = url.startsWith('https://');
    const impl = isSecure ? https : http;

    return new Promise((resolve, reject) => {
      const req = impl.request(
        url,
        {
          timeout: options.timeout,
          headers: options.headers,
          method: options.method
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
}