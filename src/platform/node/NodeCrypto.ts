import { ICrypto, IHasher } from "../Crypto";
import { createHash } from 'crypto';

export default class NodeCrypto implements ICrypto {
  createHash(algorithm: string): IHasher {
    return createHash(algorithm);
  }
}
