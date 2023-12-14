import { Regex } from "./utils/Regex";

export interface IConvertResult<TValue> {
  isSucceeded: boolean,
  value?: TValue
}

export class ValueConverters {
  static bool(value: string): IConvertResult<boolean> {
    if (Regex.isTrue(value)) {
      return ValueConverters.success<boolean>(true);
    }

    if (Regex.isFalse(value)) {
      return ValueConverters.success<boolean>(false);
    }

    return ValueConverters.error<boolean>();
  }

  private static success<TValue>(value: TValue) {
    return {
      isSucceeded: true,
      value: value
    }
  }

  private static error<TValue>() {
    return {
      isSucceeded: false
    }
  }
}