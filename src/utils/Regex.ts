import { isNullOrUndefined } from "./isNullOrUndefined";

export class Regex {
  private static patternWithFlags = /\/(.*)\/([a-z]*)/i;
  private static whiteSpaceRegex = /\s/g;
  private static trueStrRegex = /^true$/i;
  private static falseStrRegex = /^false$/i;

  static fromString(patternString: string): RegExp {
    let flags = '';
    const match = patternString.match(Regex.patternWithFlags);

    if (match) {
      patternString = match[1]; // Update the pattern string
      flags = match[2]; // Update the flags
    }

    return new RegExp(patternString, flags);
  }

  static isTrue(str: string): boolean {
    return this.trueStrRegex.test(str);
  }

  static isFalse(str: string): boolean {
    return this.falseStrRegex.test(str);
  }

  static isNullOrWhiteSpace(str: string) {
    return isNullOrUndefined(str) || !str.replace(Regex.whiteSpaceRegex, '').length;
  }
}