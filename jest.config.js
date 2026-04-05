module.exports = {
  testEnvironment: 'node',
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: ['babel-preset-expo'],
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|zustand)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types$': '<rootDir>/src/types/index.ts',
    '^@/algorithms$': '<rootDir>/src/algorithms/index.ts',
    '^@/db$': '<rootDir>/src/db/index.ts',
    '^@/theme$': '<rootDir>/src/theme/index.ts',
    '^@/i18n$': '<rootDir>/src/i18n/index.ts',
    '^@/security$': '<rootDir>/src/security/index.ts',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
}
