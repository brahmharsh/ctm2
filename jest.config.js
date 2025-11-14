export default {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^#shared/(.*)$': '<rootDir>/src/shared/$1',
    '^#backend/(.*)$': '<rootDir>/src/backend/$1',
    '^#parcheesi/(.*)$': '<rootDir>/src/backend/parcheesi/$1',
    '^#frontend/(.*)$': '<rootDir>/src/frontend/$1',
  },
  transform: {},
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/backend/**/*.js',
    '!src/backend/**/*.test.js',
    '!src/backend/**/socket/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
