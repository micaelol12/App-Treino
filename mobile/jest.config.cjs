module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  testPathIgnorePatterns: ['\\.rules\\.test\\.ts$'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/shared/validation/**/*.ts',
    'src/shared/config/environment.ts',
    'src/features/**/application/**/*.ts',
    'src/features/auth/infrastructure/firebase/firebase-auth-error.ts',
    'src/features/auth/presentation/auth-error-message.ts',
    'src/features/auth/presentation/auth-form.schema.ts',
    'src/features/**/domain/**/*.ts',
    'src/features/**/infrastructure/firestore/**/*.ts',
    '!src/features/**/application/**/*repository.ts',
    '!src/features/**/infrastructure/firestore/*.repository.ts',
    '!src/**/index.ts',
    '!src/**/*.types.ts',
    '!src/**/*.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
