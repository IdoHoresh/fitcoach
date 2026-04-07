module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      {
        caller: { name: 'metro', bundler: 'metro', platform: 'ios' },
        configFile: require.resolve('./babel.config.js'),
      },
    ],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|react-navigation|@react-navigation|zustand))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
  moduleNameMapper: {
    '^react-native-reanimated$': '<rootDir>/src/test/reanimated-mock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types$': '<rootDir>/src/types/index.ts',
    '^@/algorithms$': '<rootDir>/src/algorithms/index.ts',
    '^@/db$': '<rootDir>/src/db/index.ts',
    '^@/theme$': '<rootDir>/src/theme/index.ts',
    '^@/i18n$': '<rootDir>/src/i18n/index.ts',
    '^@/security$': '<rootDir>/src/security/index.ts',
    '^@/stores$': '<rootDir>/src/stores/index.ts',
    '^@/hooks$': '<rootDir>/src/hooks/index.ts',
    '^@/components$': '<rootDir>/src/components/index.ts',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
}
