import React, { useCallback, useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MonospaceFont, TestIDs } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import { LogLevel } from '../types'
import type { LogEntry, BackstageStyleOverrides, BackstageTheme } from '../types'
import { formatTimestamp } from '../utils/formatTimestamp'
import { JsonTreeView } from './JsonTreeView'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogItemProps {
  item: LogEntry
  onCopy?: (text: string) => void
  jsonMaxDepth?: number
  styles?: BackstageStyleOverrides
}

// ─── Badge Colors ────────────────────────────────────────────────────────────

function getBadgeConfig(
  level: LogLevel,
  t: BackstageTheme,
): { label: string; color: string; bgColor: string; rowBg: string } {
  switch (level) {
    case LogLevel.error:
      return {
        label: 'ERROR',
        color: t.error,
        bgColor: t.errorDim,
        rowBg: 'rgba(255, 77, 106, 0.06)',
      }
    case LogLevel.warn:
      return {
        label: 'WARN',
        color: t.warning,
        bgColor: t.warningDim,
        rowBg: 'rgba(255, 178, 36, 0.06)',
      }
    case LogLevel.info:
      return { label: 'INFO', color: t.info, bgColor: t.infoDim, rowBg: 'transparent' }
    case LogLevel.debug:
      return { label: 'DEBUG', color: t.debugColor, bgColor: t.debugDim, rowBg: 'transparent' }
    default:
      return {
        label: 'LOG',
        color: t.textSecondary,
        bgColor: 'rgba(160, 160, 176, 0.1)',
        rowBg: 'transparent',
      }
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export const LogItem: React.FC<LogItemProps> = React.memo(
  ({ item, onCopy, jsonMaxDepth, styles: propStyles }) => {
    const theme = useBackstageTheme()
    const s = useMemo(() => createStyles(theme), [theme])
    const [expanded, setExpanded] = useState(false)
    const badge = getBadgeConfig(item.level, theme)
    const hasData = item.data !== undefined

    const toggleExpand = useCallback(() => {
      setExpanded(prev => !prev)
    }, [])

    const handleCopy = useCallback(() => {
      if (onCopy) {
        const text = `[${badge.label}] ${formatTimestamp(item.timestamp)} ${item.message}`
        onCopy(text)
      }
    }, [item, badge.label, onCopy])

    return (
      <TouchableOpacity
        testID={TestIDs.logItem.container(item.id)}
        style={[s.container, { backgroundColor: badge.rowBg }]}
        onPress={hasData ? toggleExpand : undefined}
        onLongPress={handleCopy}
        activeOpacity={hasData ? 0.7 : 1}
      >
        <View style={s.headerRow}>
          <View
            testID={TestIDs.logItem.badge(item.id)}
            style={[s.badge, { backgroundColor: badge.bgColor }]}
          >
            <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <Text
            testID={TestIDs.logItem.timestamp(item.id)}
            style={[s.timestamp, propStyles?.logTimestampStyle]}
          >
            {formatTimestamp(item.timestamp)}
          </Text>
          {onCopy && (
            <TouchableOpacity
              testID={TestIDs.logItem.copyButton(item.id)}
              style={s.copyButton}
              onPress={handleCopy}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.copyButtonText}>⧉</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text
          testID={TestIDs.logItem.message(item.id)}
          style={[s.message, propStyles?.logMessageStyle]}
          numberOfLines={expanded ? undefined : 3}
        >
          {item.message}
        </Text>

        {expanded && hasData && (
          <View testID={TestIDs.logItem.dataContainer(item.id)} style={s.dataContainer}>
            <JsonTreeView data={item.data} hideRoot maxDepth={jsonMaxDepth} />
          </View>
        )}

        {hasData && !expanded && <Text style={s.expandHint}>tap to expand ▾</Text>}
      </TouchableOpacity>
    )
  },
)

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (t: BackstageTheme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
    badgeText: { fontFamily: MonospaceFont, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    timestamp: { fontFamily: MonospaceFont, fontSize: 11, color: t.textMuted, flex: 1 },
    copyButton: { padding: 4 },
    copyButtonText: { fontSize: 16, color: t.textMuted },
    message: { fontFamily: MonospaceFont, fontSize: 12, color: t.text, lineHeight: 18 },
    dataContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.border },
    expandHint: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      color: t.textMuted,
      marginTop: 4,
      fontStyle: 'italic',
    },
  })
