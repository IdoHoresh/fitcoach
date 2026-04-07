/**
 * Manual mock for react-native-reanimated v4.
 * Provides test-compatible stubs for hooks and animated components.
 */
const NOOP = () => {}

// Use plain string identifiers instead of real RN components to avoid TurboModule init
const View = 'View'
const Text = 'Text'
const Image = 'Image'
const ScrollView = 'ScrollView'
const FlatList = 'FlatList'

// Shared value mock — behaves like a ref with .value
function useSharedValue<T>(init: T) {
  return { value: init, get: () => init }
}

// Animated style mock — returns plain style object in tests
function useAnimatedStyle(updater: () => any) {
  return updater()
}

function useAnimatedProps(updater: () => any) {
  return updater()
}

function useDerivedValue(updater: () => any) {
  return { value: updater(), get: () => updater() }
}

// Timing/spring functions — invoke callback immediately
function withTiming(value: any, _config?: any, callback?: any) {
  if (callback) callback(true)
  return value
}

function withSpring(value: any, _config?: any, callback?: any) {
  if (callback) callback(true)
  return value
}

function withDelay(_delay: number, animation: any) {
  return animation
}

function withSequence(...animations: any[]) {
  return animations[animations.length - 1]
}

function withRepeat(animation: any) {
  return animation
}

// Interpolate mock
function interpolate(value: number, inputRange: number[], outputRange: number[]) {
  const idx = inputRange.findIndex((v) => v >= value)
  if (idx <= 0) return outputRange[0]
  if (idx >= inputRange.length) return outputRange[outputRange.length - 1]

  const ratio = (value - inputRange[idx - 1]) / (inputRange[idx] - inputRange[idx - 1])
  return outputRange[idx - 1] + ratio * (outputRange[idx] - outputRange[idx - 1])
}

// createAnimatedComponent — returns the original component
function createAnimatedComponent(component: any) {
  return component
}

const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  createAnimatedComponent,
}

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useDerivedValue,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  createAnimatedComponent,
  runOnJS: (fn: any) => fn,
  runOnUI: (fn: any) => fn,
  Easing: {
    linear: NOOP,
    ease: NOOP,
    bezier: () => NOOP,
    in: NOOP,
    out: NOOP,
    inOut: NOOP,
  },
  Extrapolation: {
    CLAMP: 'clamp',
    EXTEND: 'extend',
    IDENTITY: 'identity',
  },
  ReduceMotion: {
    System: 'system',
    Always: 'always',
    Never: 'never',
  },
  useReducedMotion: () => false,
  useAnimatedRef: () => ({ current: null }),
  measure: () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    pageX: 0,
    pageY: 0,
  }),
  scrollTo: NOOP,
  FadeIn: { duration: () => ({ delay: () => ({}) }) },
  FadeOut: { duration: () => ({ delay: () => ({}) }) },
  SlideInRight: { duration: () => ({}) },
  SlideOutLeft: { duration: () => ({}) },
  Layout: { duration: () => ({}) },
}
