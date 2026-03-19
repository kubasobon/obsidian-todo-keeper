module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js',
    '**/*.test.ts',
    '**/*.test.js',
  ],
  
  // Module name mapper for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.d.ts',
  ],
  
  // Ignore node_modules and dist
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Transform .ts and .js files in src/ with ts-jest
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'jest.tsconfig.json',
    }],
    '^.+\\.jsx?$': ['ts-jest', {
      tsconfig: 'jest.tsconfig.json',
    }],
  },
  
  // Also transform JS files in src/ (not just node_modules)
  transformIgnorePatterns: [
    'node_modules/(?!(obsidian-daily-notes-interface)/)',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
