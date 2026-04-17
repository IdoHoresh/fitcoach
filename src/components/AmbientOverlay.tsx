import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg'
import { colors } from '@/theme/colors'

/**
 * Decorative ambient glow overlay for hero screens (welcome, results).
 * Two soft radial blobs in opposite corners — teal (top-right) and
 * indigo (bottom-left) — that fade to transparent. Non-interactive.
 *
 * Matches the Stitch welcome mock's `Ambient Lab Overlay` layer.
 */

const BLOB_PRIMARY = 280
const BLOB_SECONDARY = 340

export function AmbientOverlay() {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Svg
        style={[styles.blob, styles.topRight]}
        width={BLOB_PRIMARY}
        height={BLOB_PRIMARY}
        viewBox="0 0 100 100"
      >
        <Defs>
          <RadialGradient id="teal" cx="50" cy="50" r="50" fx="50" fy="50">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.28" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#teal)" />
      </Svg>

      <Svg
        style={[styles.blob, styles.bottomLeft]}
        width={BLOB_SECONDARY}
        height={BLOB_SECONDARY}
        viewBox="0 0 100 100"
      >
        <Defs>
          <RadialGradient id="indigo" cx="50" cy="50" r="50" fx="50" fy="50">
            <Stop offset="0" stopColor={colors.info} stopOpacity="0.14" />
            <Stop offset="1" stopColor={colors.info} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#indigo)" />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
  },
  topRight: {
    top: -BLOB_PRIMARY * 0.35,
    right: -BLOB_PRIMARY * 0.35,
  },
  bottomLeft: {
    bottom: -BLOB_SECONDARY * 0.2,
    left: -BLOB_SECONDARY * 0.2,
  },
})
