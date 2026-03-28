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
}
