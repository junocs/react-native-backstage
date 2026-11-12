import React, { useCallback, useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MonospaceFont, TestIDs } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import { LogLevel, NetworkState } from '../types'
import type { LogEntry, BackstageStyleOverrides, BackstageTheme } from '../types'
import { describeApiCall } from '../utils/api-call'
import { formatTimestamp } from '../utils/formatTimestamp'
import { safeStringify, splitLogParts } from '../utils/stringify'
import { JsonTreeView } from './JsonTreeView'
import { getMethodColor, getStatusConfig } from './NetworkItem'

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

// ─── JSON Preview ────────────────────────────────────────────────────────────

// JsonTreeView's palette, so the collapsed preview and the expanded tree read the same
const JSON_TOKEN =
  /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g
const PREVIEW_CHARS = 400

const JsonPreview: React.FC<{ value: unknown; style: object }> = ({ value, style }) => {
  const theme = useBackstageTheme()
  const spans = useMemo(() => {
    const json = safeStringify(value, 0).slice(0, PREVIEW_CHARS)
    const result: Array<{ text: string; color: string }> = []
    let last = 0
    JSON_TOKEN.lastIndex = 0
    for (let match = JSON_TOKEN.exec(json); match; match = JSON_TOKEN.exec(json)) {
      if (match.index > last)
        result.push({ text: json.slice(last, match.index), color: theme.textSecondary })
      const [token, string, colon, boolean] = match
      if (string && colon) {
        result.push({ text: string, color: '#E06C75' }, { text: colon, color: theme.textSecondary })
      } else {
        const color = string
          ? '#98C379'
          : boolean
            ? '#C678DD'
            : token === 'null'
              ? theme.textMuted
              : '#61AFEF'
        result.push({ text: token, color })
      }
      last = match.index + token.length
    }
    if (last < json.length) result.push({ text: json.slice(last), color: theme.textSecondary })
    return result
  }, [value, theme])

  return (
    <Text style={style} numberOfLines={2}>
      {spans.map((span, index) => (
        <Text key={index} style={{ color: span.color }}>
          {span.text}
        </Text>
      ))}
    </Text>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export const LogItem: React.FC<LogItemProps> = React.memo(
  ({ item, onCopy, jsonMaxDepth, styles: propStyles }) => {
    const theme = useBackstageTheme()
    const s = useMemo(() => createStyles(theme), [theme])
    const [expanded, setExpanded] = useState(false)
    const hasData = item.data !== undefined

    // Objects logged with the message are shown as data, not as JSON inlined into the text
    const parts = useMemo(() => {
      if (!hasData) return null
      const { message, params } = item.data as { message: unknown; params: unknown[] }
      return splitLogParts(message, params)
    }, [item.data, hasData])
    const objects = parts?.objects ?? []
    const messageText = parts && objects.length > 0 ? parts.text : item.message
    const api = objects.length > 0 ? describeApiCall(objects[0]) : null
    const isApiLog = api && item.level !== LogLevel.warn && item.level !== LogLevel.error

    const levelBadge = getBadgeConfig(item.level, theme)
    const badge = isApiLog
      ? { ...levelBadge, color: theme.accent, bgColor: theme.accentDim }
      : levelBadge

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

        {messageText.length > 0 && (
          <Text
            testID={TestIDs.logItem.message(item.id)}
            style={[s.message, propStyles?.logMessageStyle]}
            numberOfLines={expanded ? undefined : 3}
          >
            {messageText}
          </Text>
        )}

        {api && (
          <Text style={s.apiSummary} numberOfLines={expanded ? undefined : 1}>
            <Text style={{ color: theme.accent }}>↳ </Text>
            <Text style={[s.apiMethod, { color: getMethodColor(api.method, theme) }]}>
              {api.method}
            </Text>
            {api.status !== undefined && (
              <Text
                style={[
                  s.apiMethod,
                  {
                    color: getStatusConfig(
                      { state: NetworkState.completed, status: api.status },
                      theme,
                    ).color,
                  },
                ]}
              >
                {` ${api.status}`}
              </Text>
            )}
            <Text style={{ color: theme.textSecondary }}>{` ${api.url}`}</Text>
          </Text>
        )}

        {!expanded && !api && objects.length > 0 && (
          <JsonPreview value={objects.length === 1 ? objects[0] : objects} style={s.jsonPreview} />
        )}

        {expanded && hasData && (
          <View testID={TestIDs.logItem.dataContainer(item.id)} style={s.dataContainer}>
            {objects.length > 0 ? (
              objects.map((object, index) => (
                <JsonTreeView key={index} data={object} hideRoot maxDepth={jsonMaxDepth} />
              ))
            ) : (
              <JsonTreeView data={item.data} hideRoot maxDepth={jsonMaxDepth} />
            )}
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
    apiSummary: { fontFamily: MonospaceFont, fontSize: 12, lineHeight: 18, marginTop: 2 },
    apiMethod: { fontWeight: '700' },
    jsonPreview: { fontFamily: MonospaceFont, fontSize: 12, lineHeight: 18, marginTop: 2 },
    dataContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.border },
    expandHint: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      color: t.textMuted,
      marginTop: 4,
      fontStyle: 'italic',
    },
  })
