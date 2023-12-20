import { IOptions } from "./options/IOptions";
import FbClientNode from "./platform/node/FbClientNode";
import { IFbClientWithEvents } from "./IFbClientWithEvents";

export * from './IFbClient';

/**
 * Creates an instance of the FeatBit client.
 *
 * Applications should instantiate a single instance for the lifetime of the application.
 * The client will begin attempting to connect to FeatBit as soon as it is created. To
 * determine when it is ready to use, call {@link FbClient.waitForInitialization}, or register an
 * event listener for the `"ready"` event using {@link FbClient.on}.
 *
 * **Important:** Do **not** try to instantiate `FbClient` with its constructor
 * (`new FbClientNode()`); the SDK does not currently support
 * this.
 *
 * @param options
 *   Optional configuration settings.
 * @return
 *   The new {@link FbClientNode} instance.
 */
export function init(options: IOptions = {}): IFbClientWithEvents {
  return new FbClientNode(options);
}