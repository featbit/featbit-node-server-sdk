import { ICrypto } from "../platform/ICrypto";

export class DispatchAlgorithm {
  public static IsInRollout(crypto: ICrypto, key: string, rollouts: [number, number]): boolean {
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

    const rollout: number = DispatchAlgorithm.RolloutOfKey(crypto, key);
    return rollout >= min && rollout <= max;
  }

  public static RolloutOfKey(crypto: ICrypto, key: string): number {
    const hasher = crypto.createHash('md5');
    const hashedKey = hasher.update(key).digest('hex');
    const magicNumber: number = parseInt(hashedKey.substring(0, 8), 16);
    const percentage: number = Math.abs(magicNumber / 0xfffffffffffffff);

    return percentage;
  }
}