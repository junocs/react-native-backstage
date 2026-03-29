import React, { useCallback, useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MonospaceFont } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import { NetworkState } from '../types'
import type { NetworkEntry, BackstageTheme } from '../types'
import { formatTimestamp } from '../utils/formatTimestamp'
import { JsonTreeView } from './JsonTreeView'
import { toCurl } from '../network-interceptor'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NetworkItemProps {
  item: NetworkEntry
  onCopy?: (text: string) => void
  jsonMaxDepth?: number
}

// ─── Status Badge Config ─────────────────────────────────────────────────────

function getStatusConfig(
  entry: NetworkEntry,
  t: BackstageTheme,
): { label: string; color: string; bgColor: string; rowBg: string } {
  if (entry.state === NetworkState.pending) {
    return { label: '…', color: t.warning, bgColor: t.warningDim, rowBg: 'transparent' }
  }
  if (entry.state === NetworkState.error) {
    return { label: 'ERR', color: t.error, bgColor: t.errorDim, rowBg: 'rgba(255, 77, 106, 0.06)' }
  }

  const status = entry.status ?? 0

  if (status >= 200 && status < 300) {
    return {
      label: String(status),
      color: t.success,
      bgColor: 'rgba(52, 211, 153, 0.12)',
      rowBg: 'transparent',
    }
  }
  if (status >= 300 && status < 400) {
    return { label: String(status), color: t.info, bgColor: t.infoDim, rowBg: 'transparent' }
  }
  if (status >= 400 && status < 500) {
    return {
      label: String(status),
      color: t.warning,
      bgColor: t.warningDim,
      rowBg: 'rgba(255, 178, 36, 0.06)',
    }
  }
  // 5xx
  return {
    label: String(status),
    color: t.error,
    bgColor: t.errorDim,
    rowBg: 'rgba(255, 77, 106, 0.06)',
  }
}

// ─── Method Badge Colors ─────────────────────────────────────────────────────

function getMethodColor(method: string, t: BackstageTheme): string {
  switch (method) {
    case 'GET':
      return t.success
    case 'POST':
      return t.info
    case 'PUT':
    case 'PATCH':
      return t.warning
    case 'DELETE':
      return t.error
    default:
      return t.textSecondary
  }
}

// ─── URL Helpers ─────────────────────────────────────────────────────────────

function extractPath(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname + parsed.search
    return path.length > 60 ? path.substring(0, 57) + '...' : path
  } catch {
    return url.length > 60 ? url.substring(0, 57) + '...' : url
  }
}

function extractHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}

// ─── Format Duration ─────────────────────────────────────────────────────────

function formatDuration(ms?: number): string {
  if (ms === undefined) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}

// ─── Try Parse JSON ──────────────────────────────────────────────────────────

function tryParseJSON(text?: string): unknown | null {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export const NetworkItem: React.FC<NetworkItemProps> = React.memo(
  ({ item, onCopy, jsonMaxDepth }) => {
    const theme = useBackstageTheme()
    const s = useMemo(() => createStyles(theme), [theme])
    const [expanded, setExpanded] = useState(false)
    const [detailSection, setDetailSection] = useState<'general' | 'request' | 'response'>(
      'general',
    )

    const config = getStatusConfig(item, theme)
    const methodColor = getMethodColor(item.method, theme)
    const isPending = item.state === NetworkState.pending

    const toggleExpand = useCallback(() => {
      setExpanded(prev => !prev)
    }, [])

    const handleCopyCurl = useCallback(() => {
      if (onCopy) {
        onCopy(toCurl(item))
      }
    }, [item, onCopy])

    // ─── Detail Row (inline) ─────────────────────────────────
    const renderDetailRow = (
      label: string,
      value: string,
      selectable?: boolean,
      isError?: boolean,
    ) => (
      <View style={s.detailRow}>
        <Text style={s.detailLabel}>{label}</Text>
        <Text
          style={[s.detailValue, isError && { color: theme.error }]}
          numberOfLines={3}
          selectable={selectable}
        >
          {value}
        </Text>
      </View>
    )

    return (
      <TouchableOpacity
        style={[s.container, { backgroundColor: config.rowBg }]}
        onPress={toggleExpand}
        onLongPress={handleCopyCurl}
        activeOpacity={0.7}
      >
        {/* ── Collapsed Row ─────────────────────────────────────── */}
        <View style={s.headerRow}>
          <View style={[s.methodBadge, { borderColor: methodColor }]}>
            <Text style={[s.methodText, { color: methodColor }]}>{item.method}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: config.bgColor }]}>
            <Text style={[s.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          {!isPending && <Text style={s.duration}>{formatDuration(item.duration)}</Text>}
          {isPending && <Text style={[s.duration, { color: theme.warning }]}>pending</Text>}
          {item.responseSize !== undefined && (
            <Text style={s.size}>{formatSize(item.responseSize)}</Text>
          )}
          <Text style={s.timestamp}>{formatTimestamp(item.startTime)}</Text>
        </View>

        <Text style={s.path} numberOfLines={expanded ? undefined : 1}>
          {extractPath(item.url)}
        </Text>
        <Text style={s.host} numberOfLines={1}>
          {extractHost(item.url)}
        </Text>

        {item.error && (
          <Text style={s.errorText} numberOfLines={expanded ? undefined : 1}>
            ✕ {item.error}
          </Text>
        )}

        {/* ── Expanded Detail ───────────────────────────────────── */}
        {expanded && (
          <View style={s.detailContainer}>
            <View style={s.sectionTabs}>
              {(['general', 'request', 'response'] as const).map(section => (
                <TouchableOpacity
                  key={section}
                  style={[s.sectionTab, detailSection === section && s.sectionTabActive]}
                  onPress={() => setDetailSection(section)}
                >
                  <Text
                    style={[s.sectionTabText, detailSection === section && s.sectionTabTextActive]}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {detailSection === 'general' && (
              <View style={s.sectionContent}>
                {renderDetailRow('Method', item.method)}
                {renderDetailRow('URL', item.url, true)}
                {renderDetailRow(
                  'Status',
                  item.status ? `${item.status} ${item.statusText || ''}` : '—',
                )}
                {renderDetailRow('Duration', formatDuration(item.duration))}
                {item.responseSize !== undefined &&
                  renderDetailRow('Size', formatSize(item.responseSize))}
                {item.error && renderDetailRow('Error', item.error, false, true)}
              </View>
            )}

            {detailSection === 'request' && (
              <View style={s.sectionContent}>
                {item.requestHeaders && Object.keys(item.requestHeaders).length > 0 ? (
                  <>
                    <Text style={s.subsectionTitle}>HEADERS</Text>
                    <View style={s.jsonContainer}>
                      <JsonTreeView data={item.requestHeaders} hideRoot maxDepth={jsonMaxDepth} />
                    </View>
                  </>
                ) : (
                  <Text style={s.emptyNote}>No request headers captured</Text>
                )}
                {item.requestBody ? (
                  <>
                    <Text style={s.subsectionTitle}>BODY</Text>
                    {tryParseJSON(item.requestBody) ? (
                      <View style={s.jsonContainer}>
                        <JsonTreeView
                          data={tryParseJSON(item.requestBody)}
                          hideRoot
                          maxDepth={jsonMaxDepth}
                        />
                      </View>
                    ) : (
                      <Text style={s.bodyText} selectable>
                        {item.requestBody}
                      </Text>
                    )}
                  </>
                ) : null}
              </View>
            )}

            {detailSection === 'response' && (
              <View style={s.sectionContent}>
                {item.responseHeaders && Object.keys(item.responseHeaders).length > 0 ? (
                  <>
                    <Text style={s.subsectionTitle}>HEADERS</Text>
                    <View style={s.jsonContainer}>
                      <JsonTreeView data={item.responseHeaders} hideRoot maxDepth={jsonMaxDepth} />
                    </View>
                  </>
                ) : (
                  <Text style={s.emptyNote}>No response headers captured</Text>
                )}
                {item.responseBody ? (
                  <>
                    <Text style={s.subsectionTitle}>BODY</Text>
                    {tryParseJSON(item.responseBody) ? (
                      <View style={s.jsonContainer}>
                        <JsonTreeView
                          data={tryParseJSON(item.responseBody)}
                          hideRoot
                          maxDepth={jsonMaxDepth}
                        />
                      </View>
                    ) : (
                      <Text style={s.bodyText} selectable>
                        {item.responseBody}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={s.emptyNote}>
                    {isPending ? 'Awaiting response…' : 'No response body'}
                  </Text>
                )}
              </View>
            )}

            {onCopy && (
              <TouchableOpacity style={s.curlButton} onPress={handleCopyCurl} activeOpacity={0.7}>
                <Text style={s.curlButtonText}>⧉ Copy as cURL</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!expanded && <Text style={s.expandHint}>tap to inspect ▾</Text>}
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
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
    methodBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 },
    methodText: { fontFamily: MonospaceFont, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    statusText: { fontFamily: MonospaceFont, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    duration: { fontFamily: MonospaceFont, fontSize: 11, color: t.textMuted },
    size: { fontFamily: MonospaceFont, fontSize: 10, color: t.textMuted, opacity: 0.7 },
    timestamp: { fontFamily: MonospaceFont, fontSize: 10, color: t.textMuted, marginLeft: 'auto' },
    path: { fontFamily: MonospaceFont, fontSize: 12, color: t.text, lineHeight: 18 },
    host: { fontFamily: MonospaceFont, fontSize: 10, color: t.textMuted, marginTop: 1 },
    errorText: { fontFamily: MonospaceFont, fontSize: 11, color: t.error, marginTop: 4 },
    expandHint: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      color: t.textMuted,
      marginTop: 4,
      fontStyle: 'italic',
    },
    detailContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    sectionTabs: { flexDirection: 'row', gap: 4, marginBottom: 10 },
    sectionTab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: t.surfaceElevated,
      borderWidth: 1,
      borderColor: t.border,
    },
    sectionTabActive: { backgroundColor: t.accentDim, borderColor: t.accent },
    sectionTabText: {
      fontFamily: MonospaceFont,
      fontSize: 11,
      fontWeight: '600',
      color: t.textMuted,
    },
    sectionTabTextActive: { color: t.accent },
    sectionContent: { marginBottom: 8 },
    subsectionTitle: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      fontWeight: '700',
      color: t.textMuted,
      letterSpacing: 1.2,
      marginBottom: 6,
      marginTop: 8,
    },
    jsonContainer: {
      backgroundColor: t.surfaceElevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
      padding: 8,
    },
    bodyText: {
      fontFamily: MonospaceFont,
      fontSize: 11,
      color: t.text,
      lineHeight: 16,
      backgroundColor: t.surfaceElevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
      padding: 8,
      overflow: 'hidden',
    },
    emptyNote: {
      fontFamily: MonospaceFont,
      fontSize: 11,
      color: t.textMuted,
      fontStyle: 'italic',
      paddingVertical: 8,
    },
    detailRow: { flexDirection: 'row', paddingVertical: 4 },
    detailLabel: { fontFamily: MonospaceFont, fontSize: 11, color: t.textMuted, width: 70 },
    detailValue: { fontFamily: MonospaceFont, fontSize: 11, color: t.text, flex: 1 },
    curlButton: {
      marginTop: 10,
      backgroundColor: t.accentDim,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.accent,
      paddingVertical: 8,
      paddingHorizontal: 14,
      alignSelf: 'flex-start',
    },
    curlButtonText: { fontFamily: MonospaceFont, fontSize: 12, fontWeight: '700', color: t.accent },
  })
