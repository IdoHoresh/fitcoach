// React Native globals needed in jsdom environment
// @ts-expect-error -- __DEV__ is a React Native global not typed in Node
globalThis.__DEV__ = true

// react-native-gesture-handler — RNGH's bundled jestSetup pulls in real
// Reanimated bindings (useEvent etc.) which the codebase's custom reanimated
// mock at src/test/reanimated-mock.ts intentionally omits. We mock only the
// surface the slider uses: GestureDetector renders children, Gesture.Pan
// returns a chainable that captures onUpdate/onEnd handlers without
// invoking the worklet runtime. Gesture wiring is verified manually on
// device per lessons.md:101 (gesture math is not jest-testable).
jest.mock('react-native-gesture-handler', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  const buildPanMock = () => {
    const obj: Record<string, unknown> = {}
    obj.onUpdate = () => obj
    obj.onEnd = () => obj
    obj.onBegin = () => obj
    obj.onStart = () => obj
    obj.onChange = () => obj
    obj.onFinalize = () => obj
    return obj
  }
  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: ({
      children,
      ...props
    }: {
      children?: React.ReactNode
      [key: string]: unknown
    }) => React.createElement(View, props, children),
    Gesture: {
      Pan: buildPanMock,
      Tap: buildPanMock,
      LongPress: buildPanMock,
    },
  }
})

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

// expo-linear-gradient pulls in expo-modules-core (not test-compatible). Render
// as a View so screens that include gradient backgrounds can mount in tests.
jest.mock('expo-linear-gradient', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  return {
    LinearGradient: ({
      children,
      ...props
    }: {
      children?: React.ReactNode
      [key: string]: unknown
    }) => React.createElement(View, props, children),
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
