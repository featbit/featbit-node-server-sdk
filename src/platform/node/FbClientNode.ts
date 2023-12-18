import EventEmitter from "events";
import { IOptions } from "../../options/Options";
import BasicLogger from "../../logging/BasicLogger";
import { format } from "util";
import SafeLogger from "../../logging/SafeLogger";
import NodePlatform from "./NodePlatform";
import { Emits } from "../../utils/Emits";
import { ClientEmitter } from "../../utils/ClientEmitter";
import { FbClient } from "../../FbClient";

/**
 * @ignore
 */
class FbClientNode extends FbClient {
  emitter: EventEmitter;

  constructor(options: IOptions) {
    const fallbackLogger = new BasicLogger({
      level: 'info',
      // eslint-disable-next-line no-console
      destination: console.error,
      formatter: format,
    });

    const emitter = new ClientEmitter();

    const logger = options.logger ? new SafeLogger(options.logger, fallbackLogger) : fallbackLogger;
    super(
      { ...options, logger },
      new NodePlatform({ ...options, logger }),
      {
        onError: (err: Error) => {
          if (emitter.listenerCount('error')) {
            emitter.emit('error', err);
          }
        },
        onFailed: (err: Error) => {
          emitter.emit('failed', err);
        },
        onReady: () => {
          emitter.emit('ready');
        },
        onUpdate: (key: string) => {
          emitter.emit('update', { key });
          emitter.emit(`update:${key}`, { key });
        },
        hasEventListeners: () =>
          emitter
            .eventNames()
            .some(
              (name) =>
                name === 'update' || (typeof name === 'string' && name.startsWith('update:')),
            ),
      },
    );
    this.emitter = emitter;
  }
}

export default Emits(FbClientNode);