import { IInfo } from "../Info";
import NodeInfo from "./NodeInfo";
import { IPlatform } from "../Platform";
import NodeCrypto from "./NodeCrypto";
import { ICrypto } from "../Crypto";
import { IRequests } from "../Requests";
import { IOptions } from "../../options/Options";
import NodeRequests from "./NodeRequests";

export default class NodePlatform implements IPlatform {
  info: IInfo = new NodeInfo();

  crypto: ICrypto = new NodeCrypto();

  requests: IRequests;

  constructor(options: IOptions) {
    this.requests = new NodeRequests();
  }
}