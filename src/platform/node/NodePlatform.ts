import { IInfo } from "../IInfo";
import NodeInfo from "./NodeInfo";
import { IPlatform } from "../IPlatform";
import NodeCrypto from "./NodeCrypto";
import { ICrypto } from "../ICrypto";
import { IRequests } from "../requests";
import { IOptions } from "../../options/IOptions";
import NodeRequests from "./NodeRequests";

export default class NodePlatform implements IPlatform {
  info: IInfo = new NodeInfo();

  crypto: ICrypto = new NodeCrypto();

  requests: IRequests;

  constructor(options: IOptions) {
    this.requests = new NodeRequests();
  }
}