import React, { useRef } from 'react'
import { Animated, Dimensions, PanResponder, StyleSheet, Text } from 'react-native'
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
  styles?: BackstageStyleOverrides
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PILL_WIDTH = Metrics.pillWidth
const PILL_HEIGHT = Metrics.pillHeight
const DRAG_THRESHOLD = 5

function clampPosition(x: number, y: number): { x: number; y: number } {
  const { width, height } = Dimensions.get('window')
  return {
    x: Math.max(0, Math.min(x, width - PILL_WIDTH)),
    y: Math.max(0, Math.min(y, height - PILL_HEIGHT)),
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export const FloatingPill: React.FC<FloatingPillProps> = ({
  text,
  hasError,
  onPress,
  initialX,
  initialY,
  styles: propStyles,
}) => {
  const { width: screenW, height: screenH } = Dimensions.get('window')
  const defaultX = initialX ?? screenW - PILL_WIDTH - 16
  const defaultY = initialY ?? screenH - PILL_HEIGHT - 120

  const pan = useRef(new Animated.ValueXY({ x: defaultX, y: defaultY })).current
  const lastPosition = useRef({ x: defaultX, y: defaultY })
  const isDragging = useRef(false)
  const dragDistance = useRef(0)

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
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(_, gestureState)
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset()

        const newPos = clampPosition(
          lastPosition.current.x + gestureState.dx,
          lastPosition.current.y + gestureState.dy,
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
    <Animated.View
      testID={TestIDs.floatingPill}
      {...panResponder.panHandlers}
      style={[
        styles.pill,
        {
          backgroundColor,
          transform: pan.getTranslateTransform(),
          shadowColor,
        },
        propStyles?.pillStyle,
      ]}
    >
      <Text testID={TestIDs.floatingPillText} style={[styles.pillText, propStyles?.pillTextStyle]} numberOfLines={1}>
        {text}
      </Text>
    </Animated.View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    minWidth: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
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
})
