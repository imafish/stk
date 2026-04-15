/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "./tsconfig.test.json" }],
  },
  testEnvironment: "jsdom",
  testMatch: ["**/tests/unit/**/*.test.ts"],
  passWithNoTests: true,
  moduleNameMapper: {
    "^@mozilla/readability$": "<rootDir>/tests/__mocks__/@mozilla/readability.ts",
    "^epub-gen-memory$": "<rootDir>/tests/__mocks__/epub-gen-memory.ts",
    "^dompurify$": "<rootDir>/tests/__mocks__/dompurify.ts",
    "^emailjs-com$": "<rootDir>/tests/__mocks__/emailjs-com.ts",
  },
  setupFiles: ["<rootDir>/tests/setup.ts"],
};
