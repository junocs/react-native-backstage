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
  // ── Floating Pill ──────────────────────────────
  floatingPill: 'backstage.floating-pill',
  floatingPillText: 'backstage.floating-pill.text',

  // ── Panel ──────────────────────────────────────
  panel: 'backstage.panel',
  panelModal: 'backstage.panel.modal',

  // ── Header ─────────────────────────────────────
  header: {
    container: 'backstage.header',
    title: 'backstage.header.title',
    closeButton: 'backstage.header.close',
  },

  // ── Tab Bar ────────────────────────────────────
  tabBar: 'backstage.tab-bar',
  tabs: {
    info: 'backstage.tab.info',
    network: 'backstage.tab.network',
    flags: 'backstage.tab.flags',
    storage: 'backstage.tab.storage',
    logs: 'backstage.tab.logs',
  },

  // ── Info Tab ───────────────────────────────────
  infoTab: {
    container: 'backstage.info',
    deviceInfo: 'backstage.info.device',
    stateTree: 'backstage.info.state-tree',
    quickActions: 'backstage.info.quick-actions',
    /** Dynamic: backstage.info.action.{index} */
    actionButton: (index: number) => `backstage.info.action.${index}`,
  },

  // ── Logs Tab ───────────────────────────────────
  logsTab: {
    container: 'backstage.logs',
    searchInput: 'backstage.logs.search',
    copyButton: 'backstage.logs.copy',
    list: 'backstage.logs.list',
    statsBar: 'backstage.logs.stats',
  },

  // ── Log Item ───────────────────────────────────
  logItem: {
    /** Dynamic: backstage.log-item.{id} */
    container: (id: string) => `backstage.log-item.${id}`,
    badge: (id: string) => `backstage.log-item.${id}.badge`,
    message: (id: string) => `backstage.log-item.${id}.message`,
    timestamp: (id: string) => `backstage.log-item.${id}.timestamp`,
    dataContainer: (id: string) => `backstage.log-item.${id}.data`,
    copyButton: (id: string) => `backstage.log-item.${id}.copy`,
  },

  // ── Network Tab ────────────────────────────────
  networkTab: {
    container: 'backstage.network',
    searchInput: 'backstage.network.search',
    clearButton: 'backstage.network.clear',
    list: 'backstage.network.list',
    statsBar: 'backstage.network.stats',
  },

  // ── Network Item ───────────────────────────────
  networkItem: {
    /** Dynamic: backstage.network-item.{id} */
    container: (id: string) => `backstage.network-item.${id}`,
    methodBadge: (id: string) => `backstage.network-item.${id}.method`,
    statusBadge: (id: string) => `backstage.network-item.${id}.status`,
    url: (id: string) => `backstage.network-item.${id}.url`,
    sectionTab: (id: string, section: string) => `backstage.network-item.${id}.section.${section}`,
    curlButton: (id: string) => `backstage.network-item.${id}.curl`,
  },

  // ── Flags Tab ──────────────────────────────────
  flagsTab: {
    container: 'backstage.flags',
    searchInput: 'backstage.flags.search',
    statsBar: 'backstage.flags.stats',
    list: 'backstage.flags.list',
    /** Dynamic: backstage.flag.{key} — applied to the Switch */
    flagSwitch: (key: string) => `backstage.flag.${key}`,
    flagLabel: (key: string) => `backstage.flag.${key}.label`,
    flagRow: (key: string) => `backstage.flag.${key}.row`,
  },

  // ── Storage Tab ────────────────────────────────
  storageTab: {
    container: 'backstage.storage',
    searchInput: 'backstage.storage.search',
    addButton: 'backstage.storage.add-button',
    addForm: 'backstage.storage.add-form',
    addKeyInput: 'backstage.storage.add-form.key',
    addValueInput: 'backstage.storage.add-form.value',
    addSubmitButton: 'backstage.storage.add-form.submit',
    statsBar: 'backstage.storage.stats',
    list: 'backstage.storage.list',
    /** Dynamic: backstage.storage.entry.{key} */
    entryRow: (key: string) => `backstage.storage.entry.${key}`,
    entryEditButton: (key: string) => `backstage.storage.entry.${key}.edit`,
    entryDeleteButton: (key: string) => `backstage.storage.entry.${key}.delete`,
    entryEditInput: (key: string) => `backstage.storage.entry.${key}.edit-input`,
    entrySaveButton: (key: string) => `backstage.storage.entry.${key}.save`,
    entryCancelButton: (key: string) => `backstage.storage.entry.${key}.cancel`,
  },

  // ── Bug Report ─────────────────────────────────
  bugReport: {
    triggerButton: 'backstage.bug-report.trigger',
    modal: 'backstage.bug-report.modal',
    titleInput: 'backstage.bug-report.title',
    descriptionInput: 'backstage.bug-report.description',
    severityPicker: 'backstage.bug-report.severity',
    severityOption: (severity: string) => `backstage.bug-report.severity.${severity}`,
    toggleDeviceInfo: 'backstage.bug-report.toggle.device-info',
    toggleLogs: 'backstage.bug-report.toggle.logs',
    toggleNetwork: 'backstage.bug-report.toggle.network',
    toggleState: 'backstage.bug-report.toggle.state',
    toggleScreenshot: 'backstage.bug-report.toggle.screenshot',
    shareButton: 'backstage.bug-report.share',
    cancelButton: 'backstage.bug-report.cancel',
  },
}
