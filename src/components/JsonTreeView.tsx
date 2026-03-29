import React, { useCallback, useMemo, useState } from 'react'
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native'
import { MonospaceFont } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import type { BackstageTheme } from '../types'

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface JsonTreeViewProps {
  data: unknown
  hideRoot?: boolean
  initialExpanded?: boolean
  maxDepth?: number
}

interface JsonNodeProps {
  keyName: string | null
  value: unknown
  depth: number
  maxDepth: number
  isLast: boolean
  hideKey?: boolean
}

// ─── Color Mapping ───────────────────────────────────────────────────────────

function getValueColor(value: unknown, t: BackstageTheme): string {
  if (value === null || value === undefined) return t.textMuted
  if (typeof value === 'string') return '#98C379'
  if (typeof value === 'number') return '#61AFEF'
  if (typeof value === 'boolean') return '#C678DD'
  return t.text
}

function getPreview(value: unknown): string {
  if (Array.isArray(value)) {
    return `[ ${value.length} item${value.length !== 1 ? 's' : ''} ]`
  }
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value)
    return `{ ${keys.length} key${keys.length !== 1 ? 's' : ''} }`
  }
  return ''
}

function formatValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`
  if (typeof value === 'symbol') return value.toString()
  return String(value)
}

function isExpandable(value: unknown): boolean {
  return (typeof value === 'object' && value !== null) || Array.isArray(value)
}

// ─── JsonNode Component ──────────────────────────────────────────────────────

const JsonNode: React.FC<JsonNodeProps> = ({
  keyName,
  value,
  depth,
  maxDepth,
  isLast,
  hideKey = false,
}) => {
  const theme = useBackstageTheme()
  const s = useMemo(() => createStyles(theme), [theme])
  const [expanded, setExpanded] = useState(false)
  const expandable = isExpandable(value)
  const reachedMaxDepth = depth >= maxDepth

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(prev => !prev)
  }, [])

  const indent = depth * 16

  // Primitive value
  if (!expandable || reachedMaxDepth) {
    const displayValue = reachedMaxDepth && expandable ? getPreview(value) : formatValue(value)

    return (
      <View style={[s.row, { paddingLeft: indent }]}>
        {!hideKey && keyName !== null && <Text style={s.key}>{`${keyName}: `}</Text>}
        <Text
          style={[
            s.value,
            { color: reachedMaxDepth ? theme.textMuted : getValueColor(value, theme) },
          ]}
          numberOfLines={3}
        >
          {displayValue}
        </Text>
        {!isLast && <Text style={s.comma}>,</Text>}
      </View>
    )
  }

  // Expandable object/array
  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>)

  const bracketOpen = Array.isArray(value) ? '[' : '{'
  const bracketClose = Array.isArray(value) ? ']' : '}'

  return (
    <View>
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={[s.row, { paddingLeft: indent }]}
      >
        <Text style={s.chevron}>{expanded ? '▼' : '▶'}</Text>
        {!hideKey && keyName !== null && <Text style={s.key}>{`${keyName}: `}</Text>}
        <Text style={s.bracket}>{bracketOpen}</Text>
        {!expanded && (
          <>
            <Text style={s.preview}>{` ${getPreview(value)} `}</Text>
            <Text style={s.bracket}>{bracketClose}</Text>
            {!isLast && <Text style={s.comma}>,</Text>}
          </>
        )}
      </TouchableOpacity>

      {expanded && (
        <>
          {entries.map(([k, v], i) => (
            <JsonNode
              key={`${k}_${i}`}
              keyName={Array.isArray(value) ? String(i) : k}
              value={v}
              depth={depth + 1}
              maxDepth={maxDepth}
              isLast={i === entries.length - 1}
            />
          ))}
          <View style={[s.row, { paddingLeft: indent }]}>
            <Text style={s.bracket}>{bracketClose}</Text>
            {!isLast && <Text style={s.comma}>,</Text>}
          </View>
        </>
      )}
    </View>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const JsonTreeView: React.FC<JsonTreeViewProps> = ({
  data,
  hideRoot = false,
  maxDepth = 10,
}) => {
  const theme = useBackstageTheme()
  const s = useMemo(() => createStyles(theme), [theme])

  if (data === null || data === undefined) {
    return <Text style={[s.value, { color: theme.textMuted }]}>{String(data)}</Text>
  }

  if (!isExpandable(data)) {
    return <Text style={[s.value, { color: getValueColor(data, theme) }]}>{formatValue(data)}</Text>
  }

  if (hideRoot) {
    const entries = Array.isArray(data)
      ? data.map((v, i) => [String(i), v] as const)
      : Object.entries(data as Record<string, unknown>)

    return (
      <View style={s.container}>
        {entries.map(([k, v], i) => (
          <JsonNode
            key={`${k}_${i}`}
            keyName={k}
            value={v}
            depth={0}
            maxDepth={maxDepth}
            isLast={i === entries.length - 1}
          />
        ))}
      </View>
    )
  }

  return (
    <View style={s.container}>
      <JsonNode
        keyName={null}
        value={data}
        depth={0}
        maxDepth={maxDepth}
        isLast={true}
        hideKey={true}
      />
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (t: BackstageTheme) =>
  StyleSheet.create({
    container: { paddingVertical: 4 },
    row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 2, flexWrap: 'wrap' },
    chevron: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      color: t.textMuted,
      marginRight: 6,
      marginTop: 2,
      width: 12,
    },
    key: { fontFamily: MonospaceFont, fontSize: 13, color: '#E06C75' },
    value: { fontFamily: MonospaceFont, fontSize: 13, flexShrink: 1 },
    bracket: { fontFamily: MonospaceFont, fontSize: 13, color: t.textSecondary },
    preview: { fontFamily: MonospaceFont, fontSize: 13, color: t.textMuted, fontStyle: 'italic' },
    comma: { fontFamily: MonospaceFont, fontSize: 13, color: t.textMuted },
  })
