import React, { useState } from 'react'
import {
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { DarkTheme, MonospaceFont, TestIDs } from '../constants'
import { TabBar } from './TabBar'
import { InfoTab } from './InfoTab'
import { LogsTab } from './LogsTab'
import type {
  AppInfoItem,
  BackstageStyleOverrides,
  BackstageTab,
  LogEntry,
  QuickAction,
} from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface BackstagePanelProps {
  visible: boolean
  onClose: () => void

  // Info tab props
  appVersion?: string
  buildNumber?: string
  bundleId?: string
  deviceInfo?: AppInfoItem[]
  state?: Record<string, unknown>
  quickActions?: QuickAction[]

  // Logs tab props
  logs: LogEntry[]
  onRefreshLogs: () => void
  onCopyLogs?: (logs: string) => void

  // Extensibility
  extraTabs?: BackstageTab[]

  // Styling
  styles?: BackstageStyleOverrides
  children?: React.ReactNode
}

// ─── Built-in Tab Definitions ────────────────────────────────────────────────

const BUILT_IN_TABS = [
  { key: 'info', title: 'Info', icon: 'ℹ️' },
  { key: 'logs', title: 'Logs', icon: '📋' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export const BackstagePanel: React.FC<BackstagePanelProps> = ({
  visible,
  onClose,
  appVersion,
  buildNumber,
  bundleId,
  deviceInfo,
  state,
  quickActions,
  logs,
  onRefreshLogs,
  onCopyLogs,
  extraTabs = [],
  styles: propStyles,
  children,
}) => {
  const [activeTab, setActiveTab] = useState('info')

  // Compose all tabs: built-in + extra
  const allTabs = [
    ...BUILT_IN_TABS,
    ...extraTabs.map(t => ({ key: t.key, title: t.title, icon: t.icon })),
  ]

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <InfoTab
            appVersion={appVersion}
            buildNumber={buildNumber}
            bundleId={bundleId}
            deviceInfo={deviceInfo}
            state={state}
            quickActions={quickActions}
            onClosePanel={onClose}
            styles={propStyles}
          >
            {children}
          </InfoTab>
        )
      case 'logs':
        return (
          <LogsTab
            logs={logs}
            onRefresh={onRefreshLogs}
            onCopyLogs={onCopyLogs}
            styles={propStyles}
          />
        )
      default: {
        // Render extra tab content
        const extraTab = extraTabs.find(t => t.key === activeTab)
        if (extraTab) {
          return <>{extraTab.render()}</>
        }
        return null
      }
    }
  }

  return (
    <Modal
      testID={TestIDs.panel}
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor={DarkTheme.background} />
      <SafeAreaView style={[styles.safeArea, propStyles?.panelStyle]}>
        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerBrand}>⚙</Text>
            <Text style={[styles.headerTitle, propStyles?.headerTitleStyle]}>Backstage</Text>
          </View>
          <TouchableOpacity
            testID={TestIDs.header.closeButton}
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tab Bar ─────────────────────────────────────────── */}
        <TabBar tabs={allTabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* ── Tab Content ─────────────────────────────────────── */}
        <View style={styles.content}>{renderTabContent()}</View>
      </SafeAreaView>
    </Modal>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DarkTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: MonospaceFont,
    fontSize: 18,
    fontWeight: '800',
    color: DarkTheme.text,
    letterSpacing: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DarkTheme.surfaceElevated,
    borderWidth: 1,
    borderColor: DarkTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: DarkTheme.textSecondary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
})
