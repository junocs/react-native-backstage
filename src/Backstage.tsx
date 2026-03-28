import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { StyleSheet, View } from 'react-native'
import { DEFAULT_MAX_LOGS } from './constants'
import { installInterceptor, LogBuffer, uninstallInterceptor } from './log-interceptor'
import { FloatingPill } from './components/FloatingPill'
import { BackstagePanel } from './components/BackstagePanel'
import type { BackstageProps, BackstageRef, LogEntry } from './types'

// ─── Component ───────────────────────────────────────────────────────────────

export const Backstage = forwardRef<BackstageRef, BackstageProps>(
  (
    {
      visible = true,
      appVersion,
      buildNumber,
      bundleId,
      deviceInfo,
      state,
      quickActions,
      maxLogs = DEFAULT_MAX_LOGS,
      logFilters,
      onCopyLogs,
      extraTabs,
      children,
      styles: propStyles,
      initialX,
      initialY,
      pillText,
    },
    ref,
  ) => {
    const [panelVisible, setPanelVisible] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [logs, setLogs] = useState<LogEntry[]>([])

    const logBuffer = useRef(new LogBuffer(maxLogs))

    // ── Panel controls ────────────────────────────────────────

    const openPanel = useCallback(() => {
      setPanelVisible(true)
      // Sync logs when opening panel
      setLogs(logBuffer.current.getAll())
    }, [])

    const closePanel = useCallback(() => {
      setPanelVisible(false)
    }, [])

    const clearLogs = useCallback(() => {
      logBuffer.current.clear()
      setLogs([])
      setHasError(false)
    }, [])

    // ── Refresh logs ──────────────────────────────────────────

    const refreshLogs = useCallback(() => {
      setLogs(logBuffer.current.getAll())
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

      installInterceptor(handleLogEntry, logFilters)

      return () => {
        uninstallInterceptor()
      }
    }, [logFilters])

    // ── Expose ref methods ────────────────────────────────────

    useImperativeHandle(ref, () => ({
      open: openPanel,
      close: closePanel,
      clearLogs,
    }))

    // ── Render ────────────────────────────────────────────────

    if (!visible) return null

    const displayText = pillText || (appVersion ? `v${appVersion}` : 'DEV')

    return (
      <View style={styles.container} pointerEvents="box-none">
        <FloatingPill
          text={displayText}
          hasError={hasError}
          onPress={openPanel}
          initialX={initialX}
          initialY={initialY}
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
          logs={logs}
          onRefreshLogs={refreshLogs}
          onCopyLogs={onCopyLogs}
          extraTabs={extraTabs}
          styles={propStyles}
        >
          {children}
        </BackstagePanel>
      </View>
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
