import { IRequests } from "./IRequests";
import { IInfo } from "./Info";
import { ICrypto } from "./ICrypto";

export interface IPlatform {
    /**
     * The interface for getting information about the platform and the execution
     * environment.
     */
    info: IInfo;

    /**
     * The interface for performing cryptographic operations.
     */
    crypto: ICrypto;

    /**
     * The interface for performing http/https requests.
     */
    requests: IRequests;
}