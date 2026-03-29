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

// ─── Light Theme ─────────────────────────────────────────────────────────────

export const LightTheme: BackstageTheme = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F0F4',
  border: '#D8D8DC',
  text: '#1C1C1E',
  textSecondary: '#636366',
  textMuted: '#AEAEB2',
  accent: '#6A3DE8',
  accentDim: 'rgba(106, 61, 232, 0.10)',
  error: '#E5325F',
  errorDim: 'rgba(229, 50, 95, 0.10)',
  warning: '#E09400',
  warningDim: 'rgba(224, 148, 0, 0.10)',
  success: '#28A770',
  info: '#0E8AD6',
  infoDim: 'rgba(14, 138, 214, 0.10)',
  debugColor: '#7C4DFF',
  debugDim: 'rgba(124, 77, 255, 0.10)',
}

export const DEFAULT_MAX_LOGS = 500

// ─── Network Defaults ────────────────────────────────────────────────────────

export const DEFAULT_MAX_NETWORK_ENTRIES = 500
export const DEFAULT_MAX_NETWORK_BODY_SIZE = 65536 // 64 KB

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
  networkTab: {
    section: 'backstage.network',
    searchInput: 'backstage.network.search',
    list: 'backstage.network.list',
    clearButton: 'backstage.network.clear',
  },
}
