module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/examples"],
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "examples/**/*.ts",
    "!**/*.test.ts",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  testTimeout: 10000,
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
