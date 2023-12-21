module.exports = {
  transform: { '^.+\\.ts?$': 'ts-jest' },
  testMatch: ['**/*.test.ts?(x)'],
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns : [
    "tests/platform/node/FbClientNode.test.ts",
  ],
  coveragePathIgnorePatterns: [
    "tests/platform/node/FbClientNode.test.ts"
  ],
  collectCoverageFrom: ['src/**/*.ts']
};