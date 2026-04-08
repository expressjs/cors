module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: [
    "**/*.auto.test.js",
    "**/*.auto.test.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverage: true,
  coverageReporters: ["json-summary", "text"],
  coverageDirectory: "<rootDir>/coverage",
  maxWorkers: "50%",
};