import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DarkTheme, MonospaceFont } from '../constants'
import { LogLevel } from '../types'
import type { LogEntry, BackstageStyleOverrides } from '../types'
import { formatTimestamp } from '../utils/formatTimestamp'
import { JsonTreeView } from './JsonTreeView'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogItemProps {
  item: LogEntry
  onCopy?: (text: string) => void
  styles?: BackstageStyleOverrides
}

// ─── Badge Colors ────────────────────────────────────────────────────────────

function getBadgeConfig(level: LogLevel): {
  label: string
  color: string
  bgColor: string
  rowBg: string
} {
  switch (level) {
    case LogLevel.error:
      return {
        label: 'ERROR',
        color: DarkTheme.error,
        bgColor: DarkTheme.errorDim,
        rowBg: 'rgba(255, 77, 106, 0.06)',
      }
    case LogLevel.warn:
      return {
        label: 'WARN',
        color: DarkTheme.warning,
        bgColor: DarkTheme.warningDim,
        rowBg: 'rgba(255, 178, 36, 0.06)',
      }
    case LogLevel.info:
      return {
        label: 'INFO',
        color: DarkTheme.info,
        bgColor: DarkTheme.infoDim,
        rowBg: 'transparent',
      }
    case LogLevel.debug:
      return {
        label: 'DEBUG',
        color: DarkTheme.debugColor,
        bgColor: DarkTheme.debugDim,
        rowBg: 'transparent',
      }
    default:
      return {
        label: 'LOG',
        color: DarkTheme.textSecondary,
        bgColor: 'rgba(160, 160, 176, 0.1)',
        rowBg: 'transparent',
      }
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export const LogItem: React.FC<LogItemProps> = React.memo(
  ({ item, onCopy, styles: propStyles }) => {
    const [expanded, setExpanded] = useState(false)
    const badge = getBadgeConfig(item.level)
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
        style={[styles.container, { backgroundColor: badge.rowBg }]}
        onPress={hasData ? toggleExpand : undefined}
        onLongPress={handleCopy}
        activeOpacity={hasData ? 0.7 : 1}
      >
        {/* Header row: badge + timestamp + copy */}
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: badge.bgColor }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <Text style={[styles.timestamp, propStyles?.logTimestampStyle]}>
            {formatTimestamp(item.timestamp)}
          </Text>
          {onCopy && (
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopy}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.copyButtonText}>⧉</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Message */}
        <Text
          style={[styles.message, propStyles?.logMessageStyle]}
          numberOfLines={expanded ? undefined : 3}
        >
          {item.message}
        </Text>

        {/* Expandable data */}
        {expanded && hasData && (
          <View style={styles.dataContainer}>
            <JsonTreeView data={item.data} hideRoot maxDepth={5} />
          </View>
        )}

        {/* Expand hint */}
        {hasData && !expanded && <Text style={styles.expandHint}>tap to expand ▾</Text>}
      </TouchableOpacity>
    )
  },
)

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    color: DarkTheme.textMuted,
    flex: 1,
  },
  copyButton: {
    padding: 4,
  },
  copyButtonText: {
    fontSize: 16,
    color: DarkTheme.textMuted,
  },
  message: {
    fontFamily: MonospaceFont,
    fontSize: 12,
    color: DarkTheme.text,
    lineHeight: 18,
  },
  dataContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.border,
  },
  expandHint: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    color: DarkTheme.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
})
