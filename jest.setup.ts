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

// expo-crypto pulls in expo-modules-core which crashes under jest. Tests that
// need deterministic uuids can override via local jest.mock(); the default
// here just keeps imports safe for tests that transitively touch this module.
jest.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2, 10),
}))

// expo-camera requires native modules — mock CameraView and useCameraPermissions for unit tests
jest.mock('expo-camera', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  return {
    CameraView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement(View, { testID: 'camera-view', ...props }, children),
    useCameraPermissions: jest.fn(() => [
      { granted: true, canAskAgain: true, status: 'granted' },
      jest.fn(),
    ]),
  }
})

// @expo/vector-icons pulls in expo-modules-core which is not test-compatible.
// Render icon families as plain Views so components can import them safely.
jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  function makeIcon(family: string) {
    const Icon = ({ testID, ...props }: { testID?: string; [key: string]: unknown }) =>
      React.createElement(View, { testID: testID ?? `icon-${family}`, ...props })
    Icon.displayName = family
    return Icon
  }
  return {
    Ionicons: makeIcon('Ionicons'),
    MaterialIcons: makeIcon('MaterialIcons'),
    MaterialCommunityIcons: makeIcon('MaterialCommunityIcons'),
    FontAwesome: makeIcon('FontAwesome'),
    FontAwesome5: makeIcon('FontAwesome5'),
    AntDesign: makeIcon('AntDesign'),
    Entypo: makeIcon('Entypo'),
    Feather: makeIcon('Feather'),
  }
})
