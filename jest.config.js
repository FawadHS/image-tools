/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Performance: Only scan test directories
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  
  // Performance: Ignore build artifacts and large folders
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.next/',
    '/playwright-report/',
    '/test-results/',
  ],
  
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Focused coverage: only measure tested code
  collectCoverageFrom: [
    'src/utils/mathHelpers.ts',
    // Future: add imageTransform.ts, converter.ts as they get tested
    // 'src/utils/imageTransform.ts',
    // 'src/utils/converter.ts',
  ],
  
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/.*\\.tsx$',          // UI components tested via Playwright
    'src/workers/',
    'src/main.tsx',
    'src/vite-env.d.ts',
  ],
  
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Performance: Enable caching explicitly
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
};
