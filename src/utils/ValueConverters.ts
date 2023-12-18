import { Regex } from "./Regex";
import { isNullOrUndefined } from "./isNullOrUndefined";

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

  static number(value: string): IConvertResult<number> {
    const num = Number(value);

    if (Number.isNaN(num)) {
      return ValueConverters.error<number>();
    }

    return ValueConverters.success<number>(num);
  }

  static string(value: string): IConvertResult<string> {
    return ValueConverters.success<string>(value);
  }

  static json(value: string): IConvertResult<unknown> {
    try {
      const val = JSON.parse(value);
      return ValueConverters.success<unknown>(val);
    } catch (err) {
      return ValueConverters.error<unknown>();
    }
  }

  private static success<TValue>(value: TValue): IConvertResult<TValue> {
    return {
      isSucceeded: true,
      value: value
    }
  }

  private static error<TValue>(): IConvertResult<TValue> {
    return {
      isSucceeded: false
    }
  }
}