// React Native globals needed in jsdom environment
// @ts-expect-error -- __DEV__ is a React Native global not typed in Node
globalThis.__DEV__ = true

// Haptics mock — expo-haptics requires native modules, mock for unit tests
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
}))
