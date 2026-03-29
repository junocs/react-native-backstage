import React, { useMemo } from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MonospaceFont, TestIDs } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import { JsonTreeView } from './JsonTreeView'
import type { AppInfoItem, BackstageStyleOverrides, BackstageTheme, QuickAction } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface InfoTabProps {
  appVersion?: string
  buildNumber?: string
  bundleId?: string
  deviceInfo?: AppInfoItem[]
  state?: Record<string, unknown>
  quickActions?: QuickAction[]
  jsonMaxDepth?: number
  onClosePanel?: () => void
  styles?: BackstageStyleOverrides
  children?: React.ReactNode
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const InfoTab: React.FC<InfoTabProps> = ({
  appVersion,
  buildNumber,
  bundleId,
  deviceInfo = [],
  state,
  quickActions = [],
  jsonMaxDepth,
  onClosePanel,
  styles: propStyles,
  children,
}) => {
  const theme = useBackstageTheme()
  const s = useMemo(() => createStyles(theme), [theme])

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
      testID={TestIDs.infoTab.container}
      style={s.container}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Device Info Section ─────────────────────────────────── */}
      <View testID={TestIDs.infoTab.deviceInfo} style={s.section}>
        <Text style={[s.sectionTitle, propStyles?.sectionTitleStyle]}>DEVICE INFO</Text>
        <View style={s.card}>
          {allInfo.map((item, index) => (
            <React.Fragment key={`info_${index}`}>
              <View style={s.infoRow}>
                <Text style={[s.infoLabel, propStyles?.infoLabelStyle]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[s.infoValue, propStyles?.infoValueStyle]} selectable>
                  {item.value}
                </Text>
              </View>
              {index < allInfo.length - 1 && <View style={s.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── State Tree Section ──────────────────────────────────── */}
      {state && Object.keys(state).length > 0 && (
        <View testID={TestIDs.infoTab.stateTree} style={s.section}>
          <Text style={[s.sectionTitle, propStyles?.sectionTitleStyle]}>STATE TREE</Text>
          <View style={s.card}>
            <JsonTreeView data={state} hideRoot maxDepth={jsonMaxDepth} />
          </View>
        </View>
      )}

      {/* ── Quick Actions Section ─────────────────────────────────── */}
      {quickActions.length > 0 && (
        <View testID={TestIDs.infoTab.quickActions} style={s.section}>
          <Text style={[s.sectionTitle, propStyles?.sectionTitleStyle]}>QUICK ACTIONS</Text>
          <View style={s.actionsGrid}>
            {quickActions.map((action, index) => {
              const handlePress = () => {
                action.onPress()
                if (action.closeOnPress && onClosePanel) {
                  onClosePanel()
                }
              }
              return (
                <TouchableOpacity
                  key={`action_${index}`}
                  testID={action.testID || TestIDs.infoTab.actionButton(index)}
                  style={[
                    s.actionButton,
                    action.destructive && s.actionButtonDestructive,
                    propStyles?.actionButtonStyle,
                  ]}
                  onPress={handlePress}
                  activeOpacity={0.7}
                >
                  {action.icon && <Text style={s.actionIcon}>{action.icon}</Text>}
                  <Text
                    style={[
                      s.actionButtonTitle,
                      action.destructive && s.actionButtonTitleDestructive,
                      propStyles?.actionButtonTitleStyle,
                    ]}
                  >
                    {action.title}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      {/* ── Custom Children ─────────────────────────────────────── */}
      {children && <View style={s.section}>{children}</View>}
    </ScrollView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (t: BackstageTheme) =>
  StyleSheet.create({
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
      color: t.textMuted,
      letterSpacing: 1.5,
      marginBottom: 8,
      paddingLeft: 4,
    },
    card: {
      backgroundColor: t.surfaceElevated,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
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
      color: t.textSecondary,
    },
    infoValue: {
      fontFamily: MonospaceFont,
      fontSize: 13,
      color: t.text,
      fontWeight: '600',
      textAlign: 'right',
      flex: 1,
      marginLeft: 12,
    },
    divider: {
      height: 1,
      backgroundColor: t.border,
      marginHorizontal: 4,
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    actionButton: {
      backgroundColor: t.accentDim,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.accent,
      paddingVertical: 10,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButtonDestructive: {
      backgroundColor: t.errorDim,
      borderColor: t.error,
    },
    actionIcon: {
      fontSize: 14,
      marginRight: 6,
    },
    actionButtonTitle: {
      fontFamily: MonospaceFont,
      fontSize: 13,
      fontWeight: '600',
      color: t.accent,
    },
    actionButtonTitleDestructive: {
      color: t.error,
    },
  })
