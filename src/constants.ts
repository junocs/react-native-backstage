import { Dimensions, Platform } from 'react-native'
import type { BackstageTheme } from './types'

// ─── Metrics ─────────────────────────────────────────────────────────────────

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

export const Metrics = {
  screenWidth,
  screenHeight,
  isIOS: Platform.OS === 'ios',
  pillWidth: 72,
  pillHeight: 32,
  panelBorderRadius: 20,
  tabBarHeight: 48,
  headerHeight: 52,
  sectionSpacing: 16,
  contentPadding: 16,
}

// ─── Dark Theme ──────────────────────────────────────────────────────────────

export const DarkTheme: BackstageTheme = {
  background: '#0D0D12',
  surface: '#16161E',
  surfaceElevated: '#1E1E2A',
  border: '#2A2A3A',
  text: '#E8E8ED',
  textSecondary: '#A0A0B0',
  textMuted: '#606075',
  accent: '#7C5CFC',
  accentDim: 'rgba(124, 92, 252, 0.15)',
  error: '#FF4D6A',
  errorDim: 'rgba(255, 77, 106, 0.12)',
  warning: '#FFB224',
  warningDim: 'rgba(255, 178, 36, 0.12)',
  success: '#34D399',
  info: '#38BDF8',
  infoDim: 'rgba(56, 189, 248, 0.12)',
  debugColor: '#A78BFA',
  debugDim: 'rgba(167, 139, 250, 0.12)',
}

// ─── Max Logs ────────────────────────────────────────────────────────────────

export const DEFAULT_MAX_LOGS = 500

// ─── Monospace Font ──────────────────────────────────────────────────────────

export const MonospaceFont = Platform.select({
  ios: 'Menlo',
  default: 'monospace',
})

// ─── Test IDs ────────────────────────────────────────────────────────────────

export const TestIDs = {
  floatingPill: 'backstage.floating-pill',
  panel: 'backstage.panel',
  header: {
    container: 'backstage.header',
    title: 'backstage.header.title',
    closeButton: 'backstage.header.close',
  },
  tabBar: 'backstage.tab-bar',
  tabs: {
    info: 'backstage.tab.info',
    logs: 'backstage.tab.logs',
  },
  infoTab: {
    section: 'backstage.info',
    deviceInfo: 'backstage.info.device',
    stateTree: 'backstage.info.state-tree',
    quickActions: 'backstage.info.quick-actions',
  },
  logsTab: {
    section: 'backstage.logs',
    searchInput: 'backstage.logs.search',
    copyButton: 'backstage.logs.copy',
    list: 'backstage.logs.list',
  },
}
