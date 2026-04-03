import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { MonospaceFont, TestIDs } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import { buildDeviceInfo, composeBugReport, submitToWebhook } from '../bug-report'
import type {
  AppInfoItem,
  BackstageTheme,
  BugReport,
  BugReportConfig,
  BugReportSeverity,
  LogEntry,
  NetworkEntry,
} from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface BugReportComposerProps {
  visible: boolean
  onClose: () => void
  config: BugReportConfig

  // Context data
  logs: LogEntry[]
  networkEntries: NetworkEntry[]
  state?: Record<string, unknown>
  appVersion?: string
  buildNumber?: string
  bundleId?: string
  deviceInfo?: AppInfoItem[]
}

// ─── Severity Config ─────────────────────────────────────────────────────────

const SEVERITIES: { key: BugReportSeverity; label: string; emoji: string }[] = [
  { key: 'low', label: 'Low', emoji: '🟢' },
  { key: 'medium', label: 'Medium', emoji: '🟡' },
  { key: 'high', label: 'High', emoji: '🟠' },
  { key: 'critical', label: 'Critical', emoji: '🔴' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export const BugReportComposer: React.FC<BugReportComposerProps> = ({
  visible,
  onClose,
  config,
  logs,
  networkEntries,
  state,
  appVersion,
  buildNumber,
  bundleId,
  deviceInfo: extraDeviceInfo,
}) => {
  const theme = useBackstageTheme()
  const s = useMemo(() => createStyles(theme), [theme])

  // ── Form state ────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<BugReportSeverity>('medium')
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true)
  const [includeLogs, setIncludeLogs] = useState(true)
  const [includeNetwork, setIncludeNetwork] = useState(true)
  const [includeState, setIncludeState] = useState(config.includeState !== false)
  const [includeScreenshot, setIncludeScreenshot] = useState(!!config.captureScreenshot)
  const [submitting, setSubmitting] = useState(false)

  const maxLogs = config.maxLogsInReport ?? 50
  const maxNetwork = config.maxNetworkEntriesInReport ?? 20

  const deviceInfoItems = useMemo(
    () => buildDeviceInfo(appVersion, buildNumber, bundleId, extraDeviceInfo),
    [appVersion, buildNumber, bundleId, extraDeviceInfo],
  )

  // ── Reset form ────────────────────────────────────────
  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setSeverity('medium')
    setIncludeDeviceInfo(true)
    setIncludeLogs(true)
    setIncludeNetwork(true)
    setIncludeState(config.includeState !== false)
    setIncludeScreenshot(!!config.captureScreenshot)
    setSubmitting(false)
  }, [config])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  // ── Build report ──────────────────────────────────────
  const buildReport = useCallback(async (): Promise<BugReport> => {
    let screenshotUri: string | undefined

    if (includeScreenshot && config.captureScreenshot) {
      try {
        screenshotUri = await config.captureScreenshot()
      } catch {
        // Screenshot capture failed — continue without it
      }
    }

    return {
      title: title.trim() || 'Untitled Bug Report',
      description: description.trim(),
      severity,
      deviceInfo: includeDeviceInfo ? deviceInfoItems : [],
      logs: includeLogs ? logs.slice(-maxLogs) : [],
      networkEntries: includeNetwork ? networkEntries.slice(-maxNetwork) : [],
      state: includeState ? state : undefined,
      screenshotUri,
      timestamp: Date.now(),
    }
  }, [
    title,
    description,
    severity,
    includeDeviceInfo,
    includeLogs,
    includeNetwork,
    includeState,
    includeScreenshot,
    deviceInfoItems,
    logs,
    networkEntries,
    state,
    config,
    maxLogs,
    maxNetwork,
  ])

  // ── Share via system share sheet ──────────────────────
  const handleShare = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for the bug report.')
      return
    }

    setSubmitting(true)

    try {
      const report = await buildReport()
      const markdown = composeBugReport(report)

      // Fire the onSubmit callback first
      if (config.onSubmit) {
        config.onSubmit(report)
      }

      // Submit to webhook if configured
      if (config.webhookUrl) {
        const result = await submitToWebhook(config.webhookUrl, report)
        if (!result.success) {
          Alert.alert('Webhook Error', `Failed to submit: ${result.error}`)
          setSubmitting(false)
          return
        }
      }

      // Open system share sheet
      await Share.share({
        title: `Bug Report: ${report.title}`,
        message: markdown,
      })

      handleClose()
    } catch {
      Alert.alert('Error', 'Failed to share the bug report.')
    } finally {
      setSubmitting(false)
    }
  }, [title, buildReport, config, handleClose])

  // ── Counts ────────────────────────────────────────────
  const logCount = Math.min(logs.length, maxLogs)
  const networkCount = Math.min(networkEntries.length, maxNetwork)
  const hasState = state && Object.keys(state).length > 0
  const hasScreenshot = !!config.captureScreenshot

  return (
    <Modal
      testID={TestIDs.bugReport.modal}
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView style={s.container}>
        {/* ── Header ──────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity
            testID={TestIDs.bugReport.cancelButton}
            onPress={handleClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>🐛 Bug Report</Text>
          <TouchableOpacity
            testID={TestIDs.bugReport.shareButton}
            style={[s.shareButton, !title.trim() && s.shareButtonDisabled]}
            onPress={handleShare}
            disabled={submitting || !title.trim()}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={s.shareButtonText}>{config.webhookUrl ? 'Submit' : 'Share'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.body}
          contentContainerStyle={s.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Title ─────────────────────────────────── */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Title *</Text>
            <TextInput
              testID={TestIDs.bugReport.titleInput}
              style={s.titleInput}
              placeholder="What went wrong?"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
            />
          </View>

          {/* ── Description ───────────────────────────── */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Description</Text>
            <TextInput
              testID={TestIDs.bugReport.descriptionInput}
              style={s.descriptionInput}
              placeholder="Steps to reproduce, expected vs actual behavior..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              returnKeyType="default"
            />
          </View>

          {/* ── Severity ──────────────────────────────── */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Severity</Text>
            <View testID={TestIDs.bugReport.severityPicker} style={s.severityRow}>
              {SEVERITIES.map(sev => (
                <TouchableOpacity
                  key={sev.key}
                  testID={TestIDs.bugReport.severityOption(sev.key)}
                  style={[
                    s.severityChip,
                    severity === sev.key && s.severityChipActive,
                    severity === sev.key && {
                      borderColor: getSeverityColor(sev.key, theme),
                      backgroundColor: getSeverityColor(sev.key, theme) + '20',
                    },
                  ]}
                  onPress={() => setSeverity(sev.key)}
                  activeOpacity={0.7}
                >
                  <Text style={s.severityEmoji}>{sev.emoji}</Text>
                  <Text
                    style={[
                      s.severityLabel,
                      severity === sev.key && {
                        color: getSeverityColor(sev.key, theme),
                      },
                    ]}
                  >
                    {sev.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Attachments ───────────────────────────── */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Attachments</Text>
            <View style={s.attachmentsList}>
              <ToggleRow
                testID={TestIDs.bugReport.toggleDeviceInfo}
                label="📱 Device Info"
                detail={`${deviceInfoItems.length} items`}
                value={includeDeviceInfo}
                onToggle={setIncludeDeviceInfo}
                theme={theme}
              />
              <ToggleRow
                testID={TestIDs.bugReport.toggleLogs}
                label="📋 Console Logs"
                detail={`${logCount} entries`}
                value={includeLogs}
                onToggle={setIncludeLogs}
                theme={theme}
              />
              <ToggleRow
                testID={TestIDs.bugReport.toggleNetwork}
                label="🌐 Network Activity"
                detail={`${networkCount} requests`}
                value={includeNetwork}
                onToggle={setIncludeNetwork}
                theme={theme}
              />
              {hasState && (
                <ToggleRow
                  testID={TestIDs.bugReport.toggleState}
                  label="🌳 State Snapshot"
                  detail={`${Object.keys(state!).length} keys`}
                  value={includeState}
                  onToggle={setIncludeState}
                  theme={theme}
                />
              )}
              {hasScreenshot && (
                <ToggleRow
                  testID={TestIDs.bugReport.toggleScreenshot}
                  label="📸 Screenshot"
                  detail="Capture on submit"
                  value={includeScreenshot}
                  onToggle={setIncludeScreenshot}
                  theme={theme}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

// ─── Toggle Row Sub-Component ────────────────────────────────────────────────

interface ToggleRowProps {
  testID: string
  label: string
  detail: string
  value: boolean
  onToggle: (value: boolean) => void
  theme: BackstageTheme
}

const ToggleRow: React.FC<ToggleRowProps> = ({ testID, label, detail, value, onToggle, theme }) => (
  <TouchableOpacity
    testID={testID}
    style={[toggleStyles.row, { borderBottomColor: theme.border }]}
    onPress={() => onToggle(!value)}
    activeOpacity={0.7}
  >
    <View style={toggleStyles.rowLeft}>
      <Text style={[toggleStyles.checkbox, { color: value ? theme.accent : theme.textMuted }]}>
        {value ? '☑' : '☐'}
      </Text>
      <View>
        <Text style={[toggleStyles.label, { color: theme.text }]}>{label}</Text>
        <Text style={[toggleStyles.detail, { color: theme.textMuted }]}>{detail}</Text>
      </View>
    </View>
  </TouchableOpacity>
)

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { fontSize: 20 },
  label: { fontFamily: MonospaceFont, fontSize: 14, fontWeight: '600' },
  detail: { fontFamily: MonospaceFont, fontSize: 11, marginTop: 2 },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSeverityColor(severity: BugReportSeverity, theme: BackstageTheme): string {
  switch (severity) {
    case 'low':
      return theme.success
    case 'medium':
      return theme.warning
    case 'high':
      return '#F97316' // orange
    case 'critical':
      return theme.error
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (t: BackstageTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
      ...(Platform.OS === 'android' && { paddingTop: StatusBar.currentHeight }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    headerTitle: {
      fontFamily: MonospaceFont,
      fontSize: 16,
      fontWeight: '700',
      color: t.text,
    },
    cancelText: {
      fontFamily: MonospaceFont,
      fontSize: 14,
      color: t.accent,
    },
    shareButton: {
      backgroundColor: t.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 70,
      alignItems: 'center',
    },
    shareButtonDisabled: {
      opacity: 0.4,
    },
    shareButtonText: {
      fontFamily: MonospaceFont,
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      padding: 16,
      paddingBottom: 40,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      fontWeight: '600',
      color: t.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    titleInput: {
      fontFamily: MonospaceFont,
      fontSize: 16,
      color: t.text,
      backgroundColor: t.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    },
    descriptionInput: {
      fontFamily: MonospaceFont,
      fontSize: 14,
      color: t.text,
      backgroundColor: t.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      minHeight: 100,
    },
    severityRow: {
      flexDirection: 'row',
      gap: 8,
    },
    severityChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.border,
      backgroundColor: t.surface,
    },
    severityChipActive: {
      borderWidth: 1.5,
    },
    severityEmoji: {
      fontSize: 12,
    },
    severityLabel: {
      fontFamily: MonospaceFont,
      fontSize: 11,
      fontWeight: '600',
      color: t.textMuted,
    },
    attachmentsList: {
      backgroundColor: t.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 12,
    },
  })
