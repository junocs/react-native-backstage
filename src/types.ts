import type { ReactNode } from 'react'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'

// ─── Log Types ───────────────────────────────────────────────────────────────

export enum LogLevel {
  log = 'log',
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  data?: unknown
  timestamp: number
}

// ─── Network Types ───────────────────────────────────────────────────────────

export enum NetworkState {
  pending = 'pending',
  completed = 'completed',
  error = 'error',
}

export interface NetworkEntry {
  id: string
  method: string
  url: string
  startTime: number
  endTime?: number
  duration?: number
  status?: number
  statusText?: string
  requestHeaders?: Record<string, string>
  responseHeaders?: Record<string, string>
  requestBody?: string
  responseBody?: string
  responseSize?: number
  error?: string
  state: NetworkState
}

// ─── App Info ────────────────────────────────────────────────────────────────

export interface AppInfoItem {
  label: string
  value: string
}

// ─── Quick Actions ───────────────────────────────────────────────────────────

export interface QuickAction {
  title: string
  onPress: () => void
  closeOnPress?: boolean
  icon?: string
  destructive?: boolean
  testID?: string
}

// ─── Feature Flags ─────────────────────────────────────────────────────────

export interface FeatureFlag {
  /** Unique key for this flag */
  key: string
  /** Display label */
  label: string
  /** Current value */
  value: boolean
  /** Optional description shown below the label */
  description?: string
}

// ─── Storage Adapter ─────────────────────────────────────────────────────────

export interface StorageAdapter {
  /** Return all stored keys */
  getAllKeys: () => Promise<string[]>
  /** Get value for a key. Return null if not found */
  getItem: (key: string) => Promise<string | null>
  /** Set a value for a key */
  setItem: (key: string, value: string) => Promise<void>
  /** Remove an entry by key */
  removeItem: (key: string) => Promise<void>
}

// ─── Bug Report ──────────────────────────────────────────────────────────────

export type BugReportSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface BugReport {
  /** Report title */
  title: string
  /** Detailed description */
  description: string
  /** Severity level */
  severity: BugReportSeverity
  /** Device & app info snapshot */
  deviceInfo: AppInfoItem[]
  /** Console log entries included in the report */
  logs: LogEntry[]
  /** Network entries included in the report */
  networkEntries: NetworkEntry[]
  /** State tree snapshot (if included) */
  state?: Record<string, unknown>
  /** Screenshot URI or base64 (if captured) */
  screenshotUri?: string
  /** Timestamp when the report was created */
  timestamp: number
}

export interface BugReportConfig {
  /** Callback when a report is submitted. Receives the full BugReport object */
  onSubmit?: (report: BugReport) => void
  /** Webhook URL to POST the report to */
  webhookUrl?: string
  /** Optional function to capture a screenshot. Return a file URI or base64 string */
  captureScreenshot?: () => Promise<string>
  /** Max number of log entries to include in the report. Default: 50 */
  maxLogsInReport?: number
  /** Max number of network entries to include in the report. Default: 20 */
  maxNetworkEntriesInReport?: number
  /** Whether to include the state tree in the report. Default: true */
  includeState?: boolean
}

// ─── Extensible Tabs ─────────────────────────────────────────────────────────

export interface BackstageTab {
  key: string
  title: string
  icon?: string
  render: () => ReactNode
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface BackstageTheme {
  background: string
  surface: string
  surfaceElevated: string
  border: string
  text: string
  textSecondary: string
  textMuted: string
  accent: string
  accentDim: string
  error: string
  errorDim: string
  warning: string
  warningDim: string
  success: string
  info: string
  infoDim: string
  debugColor: string
  debugDim: string
}

// ─── Main Props ──────────────────────────────────────────────────────────────

export interface BackstageProps {
  /** Whether the floating pill trigger is visible. Default: true */
  visible?: boolean

  /** Theme preference: 'light', 'dark', or 'auto' (follows device setting). Default: 'auto' */
  theme?: 'light' | 'dark' | 'auto'

  /** App version string (e.g., "1.2.3") */
  appVersion?: string

  /** Build number (e.g., "42") */
  buildNumber?: string

  /** Bundle identifier (e.g., "com.example.app") */
  bundleId?: string

  /** Additional device/app information rows */
  deviceInfo?: AppInfoItem[]

  /** State object to display in the tree viewer (Redux store, Zustand, etc.) */
  state?: Record<string, unknown>

  /** Custom action buttons in the Info tab */
  quickActions?: QuickAction[]

  /** Feature flags to display with toggle switches */
  featureFlags?: FeatureFlag[]

  /** Callback when a feature flag is toggled */
  onToggleFeatureFlag?: (key: string, value: boolean) => void

  /** Storage adapter for the Storage Viewer tab (AsyncStorage, MMKV, etc.) */
  storageAdapter?: StorageAdapter

  /** Maximum number of logs to retain in memory. Default: 500 */
  maxLogs?: number

  /** Log messages containing these strings will be excluded */
  logFilters?: string[]

  /** Callback triggered when user copies logs */
  onCopyLogs?: (logs: string) => void

  /** Additional custom tabs beyond Info and Logs */
  extraTabs?: BackstageTab[]

  /** Extra content rendered at the bottom of the Info tab */
  children?: ReactNode

  /** Custom styles overrides */
  styles?: BackstageStyleOverrides

  /** Initial X position for the floating pill */
  initialX?: number

  /** Initial Y position for the floating pill */
  initialY?: number

  /** Text displayed on the floating pill. Defaults to appVersion or "DEV" */
  pillText?: string

  /** Width of the floating pill. Default: 60 */
  pillWidth?: number

  /** Height of the floating pill. Default: 32 */
  pillHeight?: number

  /** Whether to enable network request interception. Default: true */
  enableNetworkInspector?: boolean

  /** Maximum number of network entries to retain in memory. Default: 500 */
  maxNetworkEntries?: number

  /** Maximum body size (bytes) to capture per request/response. Default: 65536 (64KB) */
  maxNetworkBodySize?: number

  /** URL substrings to exclude from network capture */
  networkFilters?: string[]

  /** Auto-filter console.logs from network callbacks (e.g., Axios interceptors) out of the Logs tab. Default: true */
  autoFilterNetworkLogs?: boolean

  /** Max nesting depth for JSON tree views (state tree, log data, network bodies). Default: 10 */
  jsonMaxDepth?: number

  /** Bug report configuration. When provided, shows a 📸 button in the panel header */
  bugReport?: BugReportConfig
}

export interface BackstageStyleOverrides {
  pillStyle?: StyleProp<ViewStyle>
  pillTextStyle?: StyleProp<TextStyle>
  panelStyle?: StyleProp<ViewStyle>
  headerTitleStyle?: StyleProp<TextStyle>
  sectionTitleStyle?: StyleProp<TextStyle>
  infoLabelStyle?: StyleProp<TextStyle>
  infoValueStyle?: StyleProp<TextStyle>
  actionButtonStyle?: StyleProp<ViewStyle>
  actionButtonTitleStyle?: StyleProp<TextStyle>
  logTimestampStyle?: StyleProp<TextStyle>
  logMessageStyle?: StyleProp<TextStyle>
}

// ─── Ref Methods ─────────────────────────────────────────────────────────────

export interface BackstageRef {
  /** Open the backstage panel */
  open: () => void
  /** Close the backstage panel */
  close: () => void
  /** Clear all captured logs */
  clearLogs: () => void
  /** Open the bug report composer programmatically */
  submitBugReport: () => void
}
