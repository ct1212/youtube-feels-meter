export default {
  // Use node environment for testing
  testEnvironment: 'node',

  // ES modules support
  transform: {},

  // Test file patterns
  testMatch: [
    '**/src/tests/**/*.test.js',
    '**/tests/**/*.test.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/tests/**/*.js',
    '!**/node_modules/**'
  ],

  // Coverage thresholds
  // Phase 1 complete: Core utilities and algorithms have 100% coverage
  // Phase 2 complete: Middleware has 100% coverage
  // Phase 3 partial: Cache service tested, API services need mocking implementation
  // Phase 4 partial: Health endpoint tested, API routes need service mocking
  coverageThreshold: {
    global: {
      statements: 20,
      branches: 16,
      functions: 36,
      lines: 20
    },
    // Critical code paths require high coverage
    './src/services/feels.calculator.js': {
      statements: 100,
      branches: 88,
      functions: 100,
      lines: 100
    },
    './src/utils/*.js': {
      statements: 98,
      branches: 91,
      functions: 100,
      lines: 100
    },
    './src/middleware/*.js': {
      statements: 100,
      branches: 50,
      functions: 100,
      lines: 100
    }
  },

  // Setup file to run before tests
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],

  // Verbose output
  verbose: true,

  // Timeout for async operations (10 seconds)
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
};
