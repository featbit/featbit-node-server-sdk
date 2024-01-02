/**
 * Interface implemented by platform-provided hasher.
 *
 * The hash implementation must support 'sha256' and 'sha1'.
 *
 * The hash implementation must support digesting to 'hex' or 'base64'.
 */
export interface IHasher {
  update(data: string): IHasher;

  digest(): Buffer;
}

/**
 * Interface provided by the platform for doing cryptographic operations.
 */
export interface ICrypto {
  createHash(algorithm: string): IHasher;
}