export { Backstage } from './Backstage'

export type {
  BackstageProps,
  BackstageRef,
  BackstageTab,
  BackstageStyleOverrides,
  BackstageTheme,
  QuickAction,
  FeatureFlag,
  StorageAdapter,
  BugReport,
  BugReportConfig,
  BugReportSeverity,
  CredentialField,
  Environment,
  EnvironmentConfig,
  SavedCredential,
  AppInfoItem,
  LogEntry,
  NetworkEntry,
} from './types'

export { LogLevel, NetworkState } from './types'
export { TestIDs, DarkTheme, LightTheme } from './constants'
export type { ThemePreference } from './ThemeContext'

// ─── Individual Components ───────────────────────────────────────────────────

export { BackstagePanel } from './components/BackstagePanel'
export { FloatingPill } from './components/FloatingPill'
export { TabBar } from './components/TabBar'
export { InfoTab } from './components/InfoTab'
export { LogsTab } from './components/LogsTab'
export { LogItem } from './components/LogItem'
export { NetworkTab } from './components/NetworkTab'
export { NetworkItem } from './components/NetworkItem'
export { FlagsTab } from './components/FlagsTab'
export { StorageTab } from './components/StorageTab'
export { BugReportComposer } from './components/BugReportComposer'
export { EnvironmentTab } from './components/EnvironmentTab'
export { JsonTreeView } from './components/JsonTreeView'
