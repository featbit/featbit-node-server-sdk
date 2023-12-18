import { IOptions } from "./options/Options";
import FbClientNode from "./platform/FbClientNode";
import { IFbClientWithEvents } from "./interfaces/FbClient";

export * from './interfaces/FbClient'

/**
 * Creates an instance of the FeatBit client.
 *
 * Applications should instantiate a single instance for the lifetime of the application.
 * The client will begin attempting to connect to FeatBit as soon as it is created. To
 * determine when it is ready to use, call {@link LDClient.waitForInitialization}, or register an
 * event listener for the `"ready"` event using {@link LDClient.on}.
 *
 * **Important:** Do **not** try to instantiate `LDClient` with its constructor
 * (`new LDClient()/new LDClientImpl()/new LDClientNode()`); the SDK does not currently support
 * this.
 *
 * @param options
 *   Optional configuration settings.
 * @return
 *   The new {@link LDClient} instance.
 */
export function init(options: IOptions = {}): IFbClientWithEvents {
  return new FbClientNode(options);
}