/**
 * Interface implemented by platform provided hasher.
 *
 * The hash implementation must support 'sha256' and 'sha1'.
 *
 * The has implementation must support digesting to 'hex' or 'base64'.
 */
export interface IHasher {
  update(data: string): IHasher;
  digest(encoding: string): string;
}

/**
 * Interface implemented by platform provided hmac.
 *
 * The hash implementation must support 'sha256'.
 *
 * The has implementation must support digesting to 'hex'.
 */
export interface IHmac extends IHasher {
  update(data: string): IHasher;
  digest(encoding: string): string;
}

/**
 * Interface provided by the platform for doing cryptographic operations.
 */
export interface ICrypto {
  createHash(algorithm: string): IHasher;
  createHmac(algorithm: string, key: string): IHmac;
  randomUUID(): string;
}