import { ICrypto, IHasher } from "../ICrypto";
import { createHash } from 'crypto';

export default class NodeCrypto implements ICrypto {
  createHash(algorithm: string): IHasher {
    return createHash(algorithm);
  }
}
