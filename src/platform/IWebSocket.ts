import EventEmitter from "events";

export interface IWebSocket {
  connect: () => void;
  close: () => void;
}

export interface IWebSocketWithEvents extends IWebSocket, EventEmitter {}