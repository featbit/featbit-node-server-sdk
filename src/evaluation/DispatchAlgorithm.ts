import { ICrypto } from "../platform/Crypto";
import { MinInt } from "../constants";

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
    const hashedBuffer = crypto.createHash('md5').update(key).digest();
    const magicNumber = hashedBuffer.readInt32LE(0);
    const percentage = Math.abs(magicNumber / MinInt);

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