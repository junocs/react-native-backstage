import React, { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { MonospaceFont, TestIDs } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import { TabBar } from './TabBar'
import { InfoTab } from './InfoTab'
import { LogsTab } from './LogsTab'
import { NetworkTab } from './NetworkTab'
import { FlagsTab } from './FlagsTab'
import { StorageTab } from './StorageTab'
import { EnvironmentTab } from './EnvironmentTab'
import { BugReportComposer } from './BugReportComposer'
import type {
  AppInfoItem,
  BackstageStyleOverrides,
  BackstageTab,
  BugReportConfig,
  EnvironmentConfig,
  FeatureFlag,
  LogEntry,
  NetworkEntry,
  QuickAction,
  StorageAdapter,
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

  // JSON tree
  jsonMaxDepth?: number

  // Storage
  storageAdapter?: StorageAdapter

  // Environment
  environmentConfig?: EnvironmentConfig

  // Bug report
  bugReportConfig?: BugReportConfig
  bugReportOpenerRef?: React.MutableRefObject<(() => void) | null>

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

const STORAGE_TAB = { key: 'storage', title: 'Storage', icon: '🗄' }

const ENVIRONMENT_TAB = { key: 'env', title: 'Env', icon: '🔐' }

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
  jsonMaxDepth,
  storageAdapter,
  environmentConfig,
  bugReportConfig,
  bugReportOpenerRef,
  styles: propStyles,
  children,
}) => {
  const [activeTab, setActiveTab] = useState('info')
  const [bugReportVisible, setBugReportVisible] = useState(false)
  const theme = useBackstageTheme()
  const styles = useMemo(() => createStyles(theme), [theme])

  // Reset to Info tab when panel closes so indicator and content stay in sync
  useEffect(() => {
    if (!visible) {
      setActiveTab('info')
    }
  }, [visible])

  // Register opener callback for the parent ref
  useEffect(() => {
    if (!bugReportOpenerRef) return
    bugReportOpenerRef.current = () => setBugReportVisible(true)
    return () => {
      bugReportOpenerRef.current = null
    }
  }, [bugReportOpenerRef])

  // Compose all tabs: built-in (conditionally including Flags, Env, Storage) + extra
  const hasFlags = featureFlags && featureFlags.length > 0
  const hasStorage = !!storageAdapter
  const hasEnv = !!environmentConfig
  const allTabs = [
    ...ALWAYS_ON_TABS,
    ...(hasFlags ? [FLAGS_TAB] : []),
    ...(hasEnv ? [ENVIRONMENT_TAB] : []),
    ...(hasStorage ? [STORAGE_TAB] : []),
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
            jsonMaxDepth={jsonMaxDepth}
            onClosePanel={onClose}
            styles={propStyles}
          >
            {children}
          </InfoTab>
        )
      case 'flags':
        return <FlagsTab flags={featureFlags ?? []} onToggle={onToggleFeatureFlag} />
      case 'storage':
        return storageAdapter ? (
          <StorageTab adapter={storageAdapter} jsonMaxDepth={jsonMaxDepth} />
        ) : null
      case 'network':
        return (
          <NetworkTab
            entries={networkEntries}
            onRefresh={onRefreshNetwork}
            onClear={onClearNetwork}
            onCopy={onCopyNetwork}
            jsonMaxDepth={jsonMaxDepth}
          />
        )
      case 'env':
        return environmentConfig ? <EnvironmentTab config={environmentConfig} /> : null
      case 'logs':
        return (
          <LogsTab
            logs={logs}
            onRefresh={onRefreshLogs}
            onCopyLogs={onCopyLogs}
            jsonMaxDepth={jsonMaxDepth}
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
      testID={TestIDs.panelModal}
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar
        barStyle={theme.background < '#888' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <SafeAreaView testID={TestIDs.panel} style={[styles.safeArea, propStyles?.panelStyle]}>
        {/* ── Header ──────────────────────────────────────────── */}
        <View testID={TestIDs.header.container} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerBrand}>⚙</Text>
            <Text
              testID={TestIDs.header.title}
              style={[styles.headerTitle, propStyles?.headerTitleStyle]}
            >
              Backstage
            </Text>
          </View>
          <View style={styles.headerRight}>
            {bugReportConfig && (
              <TouchableOpacity
                testID={TestIDs.bugReport.triggerButton}
                style={styles.headerButton}
                onPress={() => setBugReportVisible(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.headerButtonText}>🐛</Text>
              </TouchableOpacity>
            )}
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
        </View>

        {/* ── Tab Bar ─────────────────────────────────────────── */}
        <TabBar tabs={allTabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* ── Tab Content ─────────────────────────────────────── */}
        <View style={styles.content}>{renderTabContent()}</View>
      </SafeAreaView>

      {/* ── Bug Report Composer ───────────────────────────────── */}
      {bugReportConfig && (
        <BugReportComposer
          visible={bugReportVisible}
          onClose={() => setBugReportVisible(false)}
          config={bugReportConfig}
          logs={logs}
          networkEntries={networkEntries}
          state={state}
          appVersion={appVersion}
          buildNumber={buildNumber}
          bundleId={bundleId}
          deviceInfo={deviceInfo}
        />
      )}
    </Modal>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (t: import('../types').BackstageTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.background,
      // On Android, SafeAreaView does not inset for the status bar.
      // StatusBar.currentHeight gives the correct height, including
      // on Android 15+ edge-to-edge where the bar may be taller.
      ...(Platform.OS === 'android' && { paddingTop: StatusBar.currentHeight }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
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
      color: t.text,
      letterSpacing: 1,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.surfaceElevated,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: 14,
      color: t.textSecondary,
      fontWeight: '700',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.surfaceElevated,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonText: {
      fontSize: 16,
    },
    content: {
      flex: 1,
    },
  })
