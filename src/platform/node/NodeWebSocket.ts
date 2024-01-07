import { IWebSocket } from "../IWebSocket";
import WebSocket from 'ws';
import { StreamResponseEventType } from "../../data-sync/types";
import { generateConnectionToken } from "../../data-sync/utils";
import { ILogger } from "../../logging/ILogger";
import EventEmitter from "events";
import { ClientEmitter } from "../../utils/ClientEmitter";
import { Emits } from "../../utils/Emits";

const socketConnectionIntervals = [1000, 3000, 5000, 7000, 11000, 13000, 30000, 60000];

class NodeWebSocket implements IWebSocket {
  emitter: EventEmitter;
  private ws?: WebSocket;
  private retryCounter = 0;
  private closed: boolean = false;

  constructor(
    private sdkKey: string,
    private streamingUri: string,
    private logger: ILogger,
    private getStoreTimestamp: () => number,
    private pingInterval: number,
    private handshakeTimeout?: number) {
    this.emitter = new ClientEmitter();
  }

  connect() {
    let that = this;
    const startTime = Date.now();
    const url = this.streamingUri.replace(/^http/, 'ws') + `?type=server&token=${ generateConnectionToken(this.sdkKey) }`;
    this.ws = new WebSocket(url, {
      perMessageDeflate: false,
      handshakeTimeout: that.handshakeTimeout
    });

    // Connection opened
    that.ws?.addEventListener('open', function (this: WebSocket, event) {
      // this is the websocket instance to which the current listener is binded to, it's different from that.socket
      that.logger.info(`WebSocket connection succeeded, connection time: ${ Date.now() - startTime } ms`);
      that.doDataSync();
      that.sendPingMessage();
    });

    // Connection closed
    that.ws?.addEventListener('close', function (event) {
      that.logger.warn('WebSocket closed');
      if (event.code === 4003) { // do not reconnect when 4003
        return;
      }

      that.reconnect();
    });

    // Connection error
    that.ws?.addEventListener('error', function (event) {
      // reconnect
      that.logger.debug('error');
    });

    // Listen for messages
    that.ws?.addEventListener('message', function (event) {
      const message = JSON.parse(event.data as string);
      if (message.messageType === 'data-sync') {
        switch (message.data.eventType) {
          case StreamResponseEventType.patch:
            that.emitter.emit('patch', message);
            break;
          case StreamResponseEventType.full:
            that.emitter.emit('put', message);
            break;
        }
      }
    });
  }

  close(): void {
    this.closed = true;
    this.ws?.close(4003, 'The client is closed by user');
    this.ws = undefined;
  }

  private doDataSync() {
    const payload = {
      messageType: 'data-sync',
      data: {
        timestamp: this.getStoreTimestamp()
      }
    };

    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.logger.debug('requesting data');
        this.ws?.send(JSON.stringify(payload));
      } else {
        this.logger.error(`not requesting data because socket not open`);
      }
    } catch (err) {
      this.logger.debug(err);
    }
  }

  private sendPingMessage() {
    const payload = {
      messageType: 'ping',
      data: null
    };

    setTimeout(() => {
      try {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.logger.debug('sending ping')
          this.ws.send(JSON.stringify(payload));
          this.sendPingMessage();
        } else {
          this.logger.debug(`socket closed at ${ new Date() }`);
        }
      } catch (err) {
        this.logger.debug(err);
      }
    }, this.pingInterval);
  }

  private reconnect() {
    if (!this.closed) {
      this.ws = undefined;
      const waitTime = socketConnectionIntervals[Math.min(this.retryCounter++, socketConnectionIntervals.length - 1)];
      this.logger.info(`The client will try to reconnect in ${ waitTime } milliseconds.`);
      setTimeout(() => {
        this.logger.info(`The client is trying to reconnect, flag evaluation results may be stale until reconnected, waited for: ${ waitTime } milliseconds`);
        this.connect();
      }, waitTime);
    }
  }
}

export default Emits(NodeWebSocket);