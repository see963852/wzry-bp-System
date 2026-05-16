/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/.next'],
  testPathIgnorePatterns: ['<rootDir>/.next', '<rootDir>/node_modules'],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
};

module.exports = config;
