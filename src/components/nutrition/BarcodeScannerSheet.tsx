/**
 * BarcodeScannerSheet — full-screen camera modal for EAN barcode scanning.
 *
 * Flow:
 *   1. Opens → requests camera permission if not yet granted.
 *   2. Permission denied → shows Hebrew message + Settings deep-link.
 *   3. Permission granted → CameraView with ean13/ean8/upc_a detection.
 *   4. Barcode scanned → local DB lookup (getByBarcode) → OFF fallback.
 *   5. Hit → calls onFound(food, isPartial), sheet closes.
 *   6. Miss / network error → in-sheet message, "נסה שוב" clears lock.
 */

import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { FoodItem } from '@/types'
import { foodRepository } from '@/db/food-repository'
import { fetchOffProduct } from '@/services/open-food-facts'

// ── Types ─────────────────────────────────────────────────────────────

interface BarcodeScannerSheetProps {
  visible: boolean
  onClose: () => void
  onFound: (food: FoodItem, isPartial: boolean) => void
}

type ScanState = 'scanning' | 'searching' | 'not_found' | 'no_connection'

// ── Component ─────────────────────────────────────────────────────────

export function BarcodeScannerSheet({ visible, onClose, onFound }: BarcodeScannerSheetProps) {
  const strings = t().barcode
  const [permission, requestPermission] = useCameraPermissions()
  const [scanState, setScanState] = useState<ScanState>('scanning')
  const scanLock = useRef(false)

  // Request permission and reset state whenever the sheet opens
  useEffect(() => {
    if (!visible) return
    setScanState('scanning')
    scanLock.current = false
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission()
    }
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    scanLock.current = false
    setScanState('scanning')
    onClose()
  }

  function handleTryAgain() {
    scanLock.current = false
    setScanState('scanning')
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanLock.current) return
    scanLock.current = true
    setScanState('searching')

    try {
      // 1. Local DB lookup first (instant, offline)
      const local = await foodRepository.getByBarcode(data)
      if (local) {
        onFound(local, false)
        return
      }

      // 2. Open Food Facts fallback
      const result = await fetchOffProduct(data)
      if (result) {
        await foodRepository.insertFood(result.food)
        onFound(result.food, result.isPartial)
        return
      }

      // Product unknown in both local DB and OFF
      setScanState('not_found')
      scanLock.current = false
    } catch {
      setScanState('no_connection')
      scanLock.current = false
    }
  }

  if (!visible) return null

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* ── Permission not yet determined — wait for hook ── */}
        {!permission && (
          <View style={styles.centeredContent}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}

        {/* ── Permission denied ── */}
        {permission && !permission.granted && (
          <View style={styles.centeredContent}>
            <Ionicons name="camera-outline" size={56} color={colors.textSecondary} />
            <Text style={styles.permissionTitle}>{strings.permissionTitle}</Text>
            <Text style={styles.permissionBody}>{strings.permissionBody}</Text>
            <Pressable style={styles.primaryButton} onPress={() => void Linking.openSettings()}>
              <Text style={styles.primaryButtonLabel}>{strings.permissionOpenSettings}</Text>
            </Pressable>
            <Pressable style={styles.closeButtonStandalone} onPress={handleClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}

        {/* ── Camera viewfinder ── */}
        {permission?.granted && (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
              onBarcodeScanned={scanState === 'scanning' ? handleBarcodeScanned : undefined}
            />

            {/* Close button */}
            <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={12}>
              <View style={styles.closeButtonCircle}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </View>
            </Pressable>

            {/* Scan frame guide */}
            <View style={styles.frameGuide} />

            {/* Bottom overlay — scan prompt or status */}
            <View style={styles.bottomOverlay}>
              {scanState === 'scanning' && (
                <Text style={styles.scanPrompt}>{strings.scanPrompt}</Text>
              )}

              {scanState === 'searching' && (
                <View style={styles.statusRow}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={styles.statusText}>{strings.searching}</Text>
                </View>
              )}

              {(scanState === 'not_found' || scanState === 'no_connection') && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>
                    {scanState === 'not_found' ? strings.notFound : strings.noConnection}
                  </Text>
                  <Pressable style={styles.tryAgainButton} onPress={handleTryAgain}>
                    <Text style={styles.tryAgainLabel}>{strings.tryAgain}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </Modal>
  )
}

// ── Styles ────────────────────────────────────────────────────────────

const FRAME_SIZE = 240

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  permissionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  primaryButtonLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textInverse,
  },
  closeButtonStandalone: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : spacing.lg,
    left: spacing.md,
    padding: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : spacing.lg,
    left: spacing.md,
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    marginTop: -(FRAME_SIZE / 2) - 40, // shift slightly above center
    marginLeft: -(FRAME_SIZE / 2),
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 48 : spacing.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
  },
  scanPrompt: {
    fontSize: fontSize.md,
    color: '#fff',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.md,
    color: '#fff',
  },
  errorBox: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.md,
    color: '#fff',
    textAlign: 'center',
  },
  tryAgainButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tryAgainLabel: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
})
