import { ICrypto } from "../platform/ICrypto";

export class DispatchAlgorithm {
  public static isInRollout(crypto: ICrypto, key: string, rollouts: [number, number]): boolean {
    const min: number = rollouts[0];
    const max: number = rollouts[1];

    // if [0, 1]
    if (min === 0 && 1 - max < 1e-5) {
      return true;
    }

    // if [0, 0]
    if (min === 0 && max === 0) {
      return false;
    }

    const rollout: number = DispatchAlgorithm.rolloutOfKey(crypto, key);
    return rollout >= min && rollout <= max;
  }

  public static rolloutOfKey(crypto: ICrypto, key: string): number {
    const hasher = crypto.createHash('md5');
    const hashedKey = hasher.update(key).digest('hex');
    const magicNumber: number = parseInt(hashedKey.substring(0, 8), 16);
    const percentage: number = Math.abs(magicNumber / 0xfffffffffffffff);

    return percentage;
  }

  public static dispatchRollout(rollout: [number, number]): number {
    if (rollout.length !== 2) {
      // malformed rollout
      return 0.0;
    }

    return rollout[1] - rollout[0];
  }
}