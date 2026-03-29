import React, { useCallback, useMemo, useRef, useEffect } from 'react'
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { MonospaceFont } from '../constants'
import { useBackstageTheme } from '../ThemeContext'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tab {
  key: string
  title: string
  icon?: string
}

interface TabBarProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  const theme = useBackstageTheme()
  const styles = useMemo(() => createStyles(theme), [theme])
  const indicatorAnim = useRef(new Animated.Value(0)).current
  const tabWidths = useRef<Record<string, number>>({})
  const tabOffsets = useRef<Record<string, number>>({})
  const scrollRef = useRef<ScrollView>(null)

  // Animate indicator when active tab changes
  useEffect(() => {
    const offset = tabOffsets.current[activeTab] || 0
    Animated.spring(indicatorAnim, {
      toValue: offset,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start()
  }, [activeTab, indicatorAnim])

  const handleTabLayout = useCallback(
    (key: string) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout
      tabWidths.current[key] = width
      tabOffsets.current[key] = x

      // Re-animate if this is the active tab
      if (key === activeTab) {
        indicatorAnim.setValue(x)
      }
    },
    [activeTab, indicatorAnim],
  )

  const activeWidth = tabWidths.current[activeTab] || 80

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map(tab => {
          const isActive = tab.key === activeTab
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              onLayout={handleTabLayout(tab.key)}
              style={styles.tab}
              activeOpacity={0.7}
              testID={`backstage.tab.${tab.key}`}
            >
              {tab.icon && (
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
              )}
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.title}</Text>
            </TouchableOpacity>
          )
        })}

        {/* Animated underline */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: activeWidth,
              transform: [{ translateX: indicatorAnim }],
            },
          ]}
        />
      </ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (t: import('../types').BackstageTheme) =>
  StyleSheet.create({
    container: {
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    scrollContent: {
      flexDirection: 'row',
      position: 'relative',
      paddingBottom: 0,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      minWidth: 80,
    },
    tabIcon: {
      fontSize: 14,
      marginRight: 6,
      opacity: 0.5,
    },
    tabIconActive: {
      opacity: 1,
    },
    tabText: {
      fontFamily: MonospaceFont,
      fontSize: 13,
      fontWeight: '600',
      color: t.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    tabTextActive: {
      color: t.accent,
    },
    indicator: {
      position: 'absolute',
      bottom: 0,
      height: 2,
      backgroundColor: t.accent,
      borderRadius: 1,
    },
  })
