import React, { useCallback, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Metrics, MonospaceFont, TestIDs } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import type { BackstageStyleOverrides } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FloatingPillProps {
  text: string
  hasError: boolean
  onPress: () => void
  initialX?: number
  initialY?: number
  pillWidth?: number
  pillHeight?: number
  styles?: BackstageStyleOverrides
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PILL_WIDTH = Metrics.pillWidth
const PILL_HEIGHT = Metrics.pillHeight
const DRAG_THRESHOLD = 5
const INSET_PADDING = 8 // extra padding from safe area edges

interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

function clampPosition(
  x: number,
  y: number,
  insets: SafeAreaInsets,
  pillW: number,
  pillH: number,
): { x: number; y: number } {
  const { width, height } = Dimensions.get('window')
  return {
    x: Math.max(
      insets.left + INSET_PADDING,
      Math.min(x, width - pillW - insets.right - INSET_PADDING),
    ),
    y: Math.max(
      insets.top + INSET_PADDING,
      Math.min(y, height - pillH - insets.bottom - INSET_PADDING),
    ),
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export const FloatingPill: React.FC<FloatingPillProps> = ({
  text,
  hasError,
  onPress,
  initialX,
  initialY,
  pillWidth: propWidth,
  pillHeight: propHeight,
  styles: propStyles,
}) => {
  const pillW = propWidth ?? PILL_WIDTH
  const pillH = propHeight ?? PILL_HEIGHT

  const { width: screenW, height: screenH } = Dimensions.get('window')
  const defaultX = initialX ?? screenW - pillW - 16
  const defaultY = initialY ?? screenH - pillH - 120

  const pan = useRef(new Animated.ValueXY({ x: defaultX, y: defaultY })).current
  const lastPosition = useRef({ x: defaultX, y: defaultY })
  const isDragging = useRef(false)
  const dragDistance = useRef(0)

  // Safe area insets measured from invisible SafeAreaView
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })

  const handleSafeAreaLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout
      const screen = Dimensions.get('window')
      const newInsets: SafeAreaInsets = {
        top: y,
        left: x,
        bottom: screen.height - y - height,
        right: screen.width - x - width,
      }
      setInsets(newInsets)

      // Re-clamp current position to new safe area
      const clamped = clampPosition(lastPosition.current.x, lastPosition.current.y, newInsets, pillW, pillH)
      if (clamped.x !== lastPosition.current.x || clamped.y !== lastPosition.current.y) {
        lastPosition.current = clamped
        pan.setValue(clamped)
      }
    },
    [pan],
  )

  const insetsRef = useRef(insets)
  insetsRef.current = insets

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > DRAG_THRESHOLD || Math.abs(gestureState.dy) > DRAG_THRESHOLD
        )
      },
      onPanResponderGrant: () => {
        isDragging.current = false
        dragDistance.current = 0
        pan.setOffset({
          x: lastPosition.current.x,
          y: lastPosition.current.y,
        })
        pan.setValue({ x: 0, y: 0 })
      },
      onPanResponderMove: (_, gestureState) => {
        dragDistance.current = Math.sqrt(
          gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy,
        )
        if (dragDistance.current > DRAG_THRESHOLD) {
          isDragging.current = true
        }

        // Allow free dragging — bounce back happens on release
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(_, gestureState)
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset()

        const newPos = clampPosition(
          lastPosition.current.x + gestureState.dx,
          lastPosition.current.y + gestureState.dy,
          insetsRef.current,
          pillW,
          pillH,
        )

        lastPosition.current = newPos

        Animated.spring(pan, {
          toValue: newPos,
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start()

        // Only trigger tap if drag distance was minimal
        if (!isDragging.current) {
          onPress()
        }
      },
    }),
  ).current

  const theme = useBackstageTheme()

  const backgroundColor = hasError ? theme.error : theme.accent
  const shadowColor = hasError ? theme.error : theme.accent

  return (
    <>
      {/* Invisible SafeAreaView to measure insets */}
      <SafeAreaView style={componentStyles.measurer} pointerEvents="none">
        <View style={componentStyles.measurerInner} onLayout={handleSafeAreaLayout} />
      </SafeAreaView>

      <Animated.View
        testID={TestIDs.floatingPill}
        {...panResponder.panHandlers}
        style={[
          componentStyles.pill,
          {
            minWidth: pillW,
            height: pillH,
            borderRadius: pillH / 2,
            backgroundColor,
            transform: pan.getTranslateTransform(),
            shadowColor,
          },
          propStyles?.pillStyle,
        ]}
      >
        <Text
          testID={TestIDs.floatingPillText}
          style={[componentStyles.pillText, propStyles?.pillTextStyle]}
          numberOfLines={1}
        >
          {text}
        </Text>
      </Animated.View>
    </>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const componentStyles = StyleSheet.create({
  pill: {
    position: 'absolute',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pillText: {
    fontFamily: MonospaceFont,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  measurer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    opacity: 0,
  },
  measurerInner: {
    flex: 1,
  },
})
