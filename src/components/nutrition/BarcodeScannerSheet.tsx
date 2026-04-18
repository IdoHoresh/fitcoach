/**
 * BarcodeScannerSheet — full-screen camera modal for EAN barcode scanning.
 *
 * Flow:
 *   1. Opens → requests camera permission if not yet granted.
 *   2. Permission denied → shows Hebrew message + Settings deep-link.
 *   3. Permission granted → CameraView with ean13/ean8/upc_a detection.
 *   4. Barcode scanned → resolveScan() orchestrates: local DB → OFF → insert.
 *   5. local/off hit → onFound(food, isPartial), sheet closes.
 *   6. not_found (OFF 404)   → "צור מוצר חדש" CTA → ManualFoodForm (scanState 'creating').
 *   7. network_error          → "נסה שוב" re-fires OFF-only using lastEan (no re-scan).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import { resolveScan, type ScanResolverDeps, type ScanResolution } from './scan-resolver'
import { ManualFoodForm } from './ManualFoodForm'

// ── Types ─────────────────────────────────────────────────────────────

interface BarcodeScannerSheetProps {
  visible: boolean
  onClose: () => void
  onFound: (food: FoodItem, isPartial: boolean) => void
}

type ScanState = 'scanning' | 'searching' | 'not_found' | 'no_connection' | 'creating'

// ── Component ─────────────────────────────────────────────────────────

export function BarcodeScannerSheet({ visible, onClose, onFound }: BarcodeScannerSheetProps) {
  const strings = t().barcode
  const [permission, requestPermission] = useCameraPermissions()
  const [scanState, setScanState] = useState<ScanState>('scanning')
  const scanLock = useRef(false)
  const lastEan = useRef<string | null>(null)

  // Dependencies for resolveScan — kept stable so the helper is easily testable
  // via dependency injection in scan-resolver.test.ts.
  const deps = useMemo<ScanResolverDeps>(
    () => ({
      getByBarcode: (ean: string) => foodRepository.getByBarcode(ean),
      fetchOffProduct,
      insertFood: (food: FoodItem) => foodRepository.insertFood(food),
    }),
    [],
  )

  // Request permission and reset state whenever the sheet opens
  useEffect(() => {
    if (!visible) return
    setScanState('scanning')
    scanLock.current = false
    lastEan.current = null
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission()
    }
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    scanLock.current = false
    lastEan.current = null
    setScanState('scanning')
    onClose()
  }

  function applyResolution(r: ScanResolution) {
    switch (r.kind) {
      case 'local_hit':
        onFound(r.food, false)
        return
      case 'off_hit':
        onFound(r.food, r.isPartial)
        return
      case 'not_found':
        setScanState('not_found')
        scanLock.current = false
        return
      case 'network_error':
        setScanState('no_connection')
        scanLock.current = false
        return
    }
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanLock.current) return
    scanLock.current = true
    lastEan.current = data
    setScanState('searching')

    const resolution = await resolveScan(data, deps)
    applyResolution(resolution)
  }

  async function handleRetryOff() {
    const ean = lastEan.current
    if (!ean) {
      // Defensive: if lastEan was cleared, fall back to rescanning
      setScanState('scanning')
      scanLock.current = false
      return
    }
    setScanState('searching')
    const resolution = await resolveScan(ean, deps)
    applyResolution(resolution)
  }

  function handleCreateManual() {
    setScanState('creating')
  }

  function handleCancelCreate() {
    // Back to camera — user may want to try a different product
    scanLock.current = false
    lastEan.current = null
    setScanState('scanning')
  }

  async function handleManualSubmit(food: FoodItem) {
    // getByBarcode in handleBarcodeScanned already ruled out a manual_<ean>
    // collision; insertFood is safe here without a pre-check.
    await foodRepository.insertFood(food)
    onFound(food, false)
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

        {/* ── Manual-create form (OFF 404 → user fills a new FoodItem) ── */}
        {permission?.granted && scanState === 'creating' && lastEan.current && (
          <ManualFoodForm
            ean={lastEan.current}
            onSubmit={handleManualSubmit}
            onCancel={handleCancelCreate}
            testID="manual-food-form"
          />
        )}

        {/* ── Camera viewfinder ── */}
        {permission?.granted && scanState !== 'creating' && (
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

              {scanState === 'not_found' && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{strings.notFound}</Text>
                  <Pressable style={styles.primaryCta} onPress={handleCreateManual}>
                    <Text style={styles.primaryCtaLabel}>{strings.notFoundCreate}</Text>
                  </Pressable>
                </View>
              )}

              {scanState === 'no_connection' && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{strings.noConnection}</Text>
                  <Pressable style={styles.tryAgainButton} onPress={handleRetryOff}>
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
  primaryCta: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  primaryCtaLabel: {
    fontSize: fontSize.sm,
    color: colors.onPrimary,
    fontWeight: fontWeight.semibold,
  },
})
