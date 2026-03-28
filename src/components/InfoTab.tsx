import React from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DarkTheme, MonospaceFont } from '../constants'
import { JsonTreeView } from './JsonTreeView'
import type { AppInfoItem, BackstageStyleOverrides, QuickAction } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface InfoTabProps {
  appVersion?: string
  buildNumber?: string
  bundleId?: string
  deviceInfo?: AppInfoItem[]
  state?: Record<string, unknown>
  quickActions?: QuickAction[]
  onClosePanel?: () => void
  styles?: BackstageStyleOverrides
  children?: React.ReactNode
}

// ─── Info Row ────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{
  label: string
  value: string
  labelStyle?: BackstageStyleOverrides['infoLabelStyle']
  valueStyle?: BackstageStyleOverrides['infoValueStyle']
}> = ({ label, value, labelStyle, valueStyle }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, labelStyle]} numberOfLines={1}>
      {label}
    </Text>
    <Text style={[styles.infoValue, valueStyle]} numberOfLines={2} selectable>
      {value}
    </Text>
  </View>
)

// ─── Section Header ──────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  title: string
  titleStyle?: BackstageStyleOverrides['sectionTitleStyle']
}> = ({ title, titleStyle }) => <Text style={[styles.sectionTitle, titleStyle]}>{title}</Text>

// ─── Action Button ───────────────────────────────────────────────────────────

const ActionButton: React.FC<{
  action: QuickAction
  onClosePanel?: () => void
  buttonStyle?: BackstageStyleOverrides['actionButtonStyle']
  buttonTitleStyle?: BackstageStyleOverrides['actionButtonTitleStyle']
}> = ({ action, onClosePanel, buttonStyle, buttonTitleStyle }) => {
  const handlePress = () => {
    action.onPress()
    if (action.closeOnPress && onClosePanel) {
      onClosePanel()
    }
  }

  return (
    <TouchableOpacity
      testID={action.testID}
      style={[
        styles.actionButton,
        action.destructive && styles.actionButtonDestructive,
        buttonStyle,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {action.icon && <Text style={styles.actionIcon}>{action.icon}</Text>}
      <Text
        style={[
          styles.actionButtonTitle,
          action.destructive && styles.actionButtonTitleDestructive,
          buttonTitleStyle,
        ]}
      >
        {action.title}
      </Text>
    </TouchableOpacity>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const InfoTab: React.FC<InfoTabProps> = ({
  appVersion,
  buildNumber,
  bundleId,
  deviceInfo = [],
  state,
  quickActions = [],
  onClosePanel,
  styles: propStyles,
  children,
}) => {
  // Built-in device info from Platform API
  const builtInInfo: AppInfoItem[] = [
    { label: 'Platform', value: Platform.OS.toUpperCase() },
    { label: 'OS Version', value: String(Platform.Version) },
  ]

  if (appVersion) {
    builtInInfo.push({ label: 'App Version', value: appVersion })
  }
  if (buildNumber) {
    builtInInfo.push({ label: 'Build Number', value: buildNumber })
  }
  if (bundleId) {
    builtInInfo.push({ label: 'Bundle ID', value: bundleId })
  }

  const allInfo = [...builtInInfo, ...deviceInfo]

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Device Info Section ─────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="DEVICE INFO" titleStyle={propStyles?.sectionTitleStyle} />
        <View style={styles.card}>
          {allInfo.map((item, index) => (
            <React.Fragment key={`info_${index}`}>
              <InfoRow
                label={item.label}
                value={item.value}
                labelStyle={propStyles?.infoLabelStyle}
                valueStyle={propStyles?.infoValueStyle}
              />
              {index < allInfo.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── State Tree Section ──────────────────────────────────── */}
      {state && Object.keys(state).length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="STATE TREE" titleStyle={propStyles?.sectionTitleStyle} />
          <View style={styles.card}>
            <JsonTreeView data={state} hideRoot />
          </View>
        </View>
      )}

      {/* ── Quick Actions Section ───────────────────────────────── */}
      {quickActions.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="QUICK ACTIONS" titleStyle={propStyles?.sectionTitleStyle} />
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <ActionButton
                key={`action_${index}`}
                action={action}
                onClosePanel={onClosePanel}
                buttonStyle={propStyles?.actionButtonStyle}
                buttonTitleStyle={propStyles?.actionButtonTitleStyle}
              />
            ))}
          </View>
        </View>
      )}

      {/* ── Custom Children ─────────────────────────────────────── */}
      {children && <View style={styles.section}>{children}</View>}
    </ScrollView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    fontWeight: '700',
    color: DarkTheme.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: DarkTheme.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DarkTheme.border,
    padding: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  infoLabel: {
    fontFamily: MonospaceFont,
    fontSize: 13,
    color: DarkTheme.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontFamily: MonospaceFont,
    fontSize: 13,
    color: DarkTheme.text,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: DarkTheme.border,
    marginHorizontal: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    backgroundColor: DarkTheme.accentDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DarkTheme.accent,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonDestructive: {
    backgroundColor: DarkTheme.errorDim,
    borderColor: DarkTheme.error,
  },
  actionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  actionButtonTitle: {
    fontFamily: MonospaceFont,
    fontSize: 13,
    fontWeight: '600',
    color: DarkTheme.accent,
  },
  actionButtonTitleDestructive: {
    color: DarkTheme.error,
  },
})
