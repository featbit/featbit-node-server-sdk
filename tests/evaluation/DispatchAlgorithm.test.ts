import { DispatchAlgorithm } from "../../src/evaluation/DispatchAlgorithm";
import crypto from "crypto";

describe('given a DispatchAlgorithm', () => {
  const cases: [string, number][] = [
    ['test-value', 0.14653629204258323],
    ['qKPKh1S3FolC', 0.9105919692665339],
    ['3eacb184-2d79-49df-9ea7-edd4f10e4c6f', 0.08994403155520558]
  ];

  it.each(cases)('rolloutOfKey for %s', (input, expected) => {
    expect(DispatchAlgorithm.rolloutOfKey(crypto, input)).toBe(expected);
  });
});