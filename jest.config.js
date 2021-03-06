// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html
module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  },
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    "json",
    "text",
    "lcov",
    "clover"
  ],
  // An array of file extensions your modules use
  moduleFileExtensions: [
    'js',
    'ts',
    'json'
  ],
  preset: 'ts-jest',
  rootDir: 'test',
  roots: [
    "<rootDir>"
  ],
  testEnvironment: 'node',
  testMatch: [
    '**/?(*.)+(test).ts?(x)',
    '**/?(*.)+(intg).ts?(x)',
    '**/?(*.)+(func).ts?(x)',
  ],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  }
  //automock: true
};
