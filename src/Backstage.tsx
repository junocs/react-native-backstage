import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { StyleSheet, View } from 'react-native'
import { DEFAULT_MAX_LOGS, DEFAULT_MAX_NETWORK_ENTRIES } from './constants'
import { installInterceptor, LogBuffer, uninstallInterceptor } from './log-interceptor'
import {
  installNetworkInterceptor,
  NetworkBuffer,
  uninstallNetworkInterceptor,
} from './network-interceptor'
import { FloatingPill } from './components/FloatingPill'
import { BackstagePanel } from './components/BackstagePanel'
import { BackstageThemeProvider } from './ThemeContext'
import type { BackstageProps, BackstageRef, LogEntry, NetworkEntry } from './types'

// ─── Component ───────────────────────────────────────────────────────────────

export const Backstage = forwardRef<BackstageRef, BackstageProps>(
  (
    {
      visible = true,
      theme: themePreference = 'auto',
      appVersion,
      buildNumber,
      bundleId,
      deviceInfo,
      state,
      quickActions,
      featureFlags,
      onToggleFeatureFlag,
      storageAdapter,
      maxLogs = DEFAULT_MAX_LOGS,
      logFilters,
      onCopyLogs,
      extraTabs,
      children,
      styles: propStyles,
      initialX,
      initialY,
      pillText,
      pillWidth,
      pillHeight,
      enableNetworkInspector = true,
      maxNetworkEntries = DEFAULT_MAX_NETWORK_ENTRIES,
      maxNetworkBodySize,
      networkFilters,
      autoFilterNetworkLogs = true,
      jsonMaxDepth,
      bugReport: bugReportConfig,
      environmentConfig,
    },
    ref,
  ) => {
    const [panelVisible, setPanelVisible] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [networkEntries, setNetworkEntries] = useState<NetworkEntry[]>([])

    const logBuffer = useRef(new LogBuffer(maxLogs))
    const networkBuffer = useRef(new NetworkBuffer(maxNetworkEntries))

    // ── Panel controls ────────────────────────────────────────

    const openPanel = useCallback(() => {
      setPanelVisible(true)
      // Sync logs and network entries when opening panel
      setLogs(logBuffer.current.getAll())
      setNetworkEntries(networkBuffer.current.getAll())
    }, [])

    const closePanel = useCallback(() => {
      setPanelVisible(false)
    }, [])

    const clearLogs = useCallback(() => {
      logBuffer.current.clear()
      setLogs([])
      setHasError(false)
    }, [])

    // ── Refresh logs ──────────────────────────────────────────────────

    const refreshLogs = useCallback(() => {
      setLogs(logBuffer.current.getAll())
    }, [])

    // ── Network controls ──────────────────────────────────────────────

    const refreshNetwork = useCallback(() => {
      setNetworkEntries(networkBuffer.current.getAll())
    }, [])

    const clearNetwork = useCallback(() => {
      networkBuffer.current.clear()
      setNetworkEntries([])
    }, [])

    // ── Install console interceptor ───────────────────────────

    useEffect(() => {
      const handleLogEntry = (entry: LogEntry) => {
        logBuffer.current.push(entry)

        // Track error state for the floating pill
        if (entry.level === 'error') {
          setHasError(true)
        }
      }

      installInterceptor(handleLogEntry, logFilters, {
        autoFilterNetworkLogs: enableNetworkInspector && autoFilterNetworkLogs,
      })

      return () => {
        uninstallInterceptor()
      }
    }, [logFilters, enableNetworkInspector, autoFilterNetworkLogs])

    // ── Install network interceptor ───────────────────────────────

    useEffect(() => {
      if (!enableNetworkInspector) return

      const handleNetworkEntry = (entry: NetworkEntry) => {
        networkBuffer.current.upsert(entry)

        // Auto-refresh if panel is open
        if (panelVisible) {
          setNetworkEntries(networkBuffer.current.getAll())
        }
      }

      installNetworkInterceptor(handleNetworkEntry, {
        filters: networkFilters,
        maxBodySize: maxNetworkBodySize,
      })

      return () => {
        uninstallNetworkInterceptor()
      }
    }, [enableNetworkInspector, networkFilters, maxNetworkBodySize, panelVisible])

    // ── Expose ref methods ────────────────────────────────────

    const openBugReportRef = useRef<(() => void) | null>(null)

    useImperativeHandle(ref, () => ({
      open: openPanel,
      close: closePanel,
      clearLogs,
      submitBugReport: () => {
        if (bugReportConfig) {
          openPanel()
          // Small delay to let panel mount first
          setTimeout(() => openBugReportRef.current?.(), 100)
        }
      },
    }))

    // ── Render ────────────────────────────────────────────────

    if (!visible) return null

    const displayText = pillText || (appVersion ? `v${appVersion}` : 'DEV')

    return (
      <BackstageThemeProvider preference={themePreference}>
        <View style={styles.container} pointerEvents="box-none">
          <FloatingPill
            text={displayText}
            hasError={hasError}
            onPress={openPanel}
            initialX={initialX}
            initialY={initialY}
            pillWidth={pillWidth}
            pillHeight={pillHeight}
            styles={propStyles}
          />
          <BackstagePanel
            visible={panelVisible}
            onClose={closePanel}
            appVersion={appVersion}
            buildNumber={buildNumber}
            bundleId={bundleId}
            deviceInfo={deviceInfo}
            state={state}
            quickActions={quickActions}
            featureFlags={featureFlags}
            onToggleFeatureFlag={onToggleFeatureFlag}
            logs={logs}
            onRefreshLogs={refreshLogs}
            onCopyLogs={onCopyLogs}
            networkEntries={networkEntries}
            onRefreshNetwork={refreshNetwork}
            onClearNetwork={clearNetwork}
            onCopyNetwork={onCopyLogs}
            extraTabs={extraTabs}
            jsonMaxDepth={jsonMaxDepth}
            storageAdapter={storageAdapter}
            environmentConfig={environmentConfig}
            bugReportConfig={bugReportConfig}
            bugReportOpenerRef={openBugReportRef}
            styles={propStyles}
          >
            {children}
          </BackstagePanel>
        </View>
      </BackstageThemeProvider>
    )
  },
)

Backstage.displayName = 'Backstage'

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
})
