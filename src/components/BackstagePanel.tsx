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
import { NetworkTab } from './NetworkTab'
import { FlagsTab } from './FlagsTab'
import type {
  AppInfoItem,
  BackstageStyleOverrides,
  BackstageTab,
  FeatureFlag,
  LogEntry,
  NetworkEntry,
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
  featureFlags?: FeatureFlag[]
  onToggleFeatureFlag?: (key: string, value: boolean) => void

  // Logs tab props
  logs: LogEntry[]
  onRefreshLogs: () => void
  onCopyLogs?: (logs: string) => void

  // Network tab props
  networkEntries: NetworkEntry[]
  onRefreshNetwork: () => void
  onClearNetwork: () => void
  onCopyNetwork?: (text: string) => void

  // Extensibility
  extraTabs?: BackstageTab[]

  // Styling
  styles?: BackstageStyleOverrides
  children?: React.ReactNode
}

// ─── Built-in Tab Definitions ────────────────────────────────────────────

const ALWAYS_ON_TABS = [
  { key: 'info', title: 'Info', icon: 'ℹ️' },
  { key: 'network', title: 'Network', icon: '🌐' },
]

const FLAGS_TAB = { key: 'flags', title: 'Flags', icon: '🎚' }

const LOGS_TAB = { key: 'logs', title: 'Logs', icon: '📋' }

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
  featureFlags,
  onToggleFeatureFlag,
  logs,
  onRefreshLogs,
  onCopyLogs,
  networkEntries,
  onRefreshNetwork,
  onClearNetwork,
  onCopyNetwork,
  extraTabs = [],
  styles: propStyles,
  children,
}) => {
  const [activeTab, setActiveTab] = useState('info')

  // Compose all tabs: built-in (conditionally including Flags) + extra
  const hasFlags = featureFlags && featureFlags.length > 0
  const allTabs = [
    ...ALWAYS_ON_TABS,
    ...(hasFlags ? [FLAGS_TAB] : []),
    LOGS_TAB,
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
      case 'flags':
        return (
          <FlagsTab
            flags={featureFlags ?? []}
            onToggle={onToggleFeatureFlag}
          />
        )
      case 'network':
        return (
          <NetworkTab
            entries={networkEntries}
            onRefresh={onRefreshNetwork}
            onClear={onClearNetwork}
            onCopy={onCopyNetwork}
          />
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
