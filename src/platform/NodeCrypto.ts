import { ICrypto, IHasher, IHmac } from "./ICrypto";
import { createHash, createHmac, randomUUID } from 'crypto';

export default class NodeCrypto implements ICrypto {
  createHash(algorithm: string): IHasher {
    return createHash(algorithm);
  }

  createHmac(algorithm: string, key: string): IHmac {
    return createHmac(algorithm, key);
  }

  randomUUID() {
    return randomUUID();
  }
}
