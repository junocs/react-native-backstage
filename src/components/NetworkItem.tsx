import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DarkTheme, MonospaceFont } from '../constants'
import { NetworkState } from '../types'
import type { NetworkEntry } from '../types'
import { formatTimestamp } from '../utils/formatTimestamp'
import { JsonTreeView } from './JsonTreeView'
import { toCurl } from '../network-interceptor'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NetworkItemProps {
  item: NetworkEntry
  onCopy?: (text: string) => void
}

// ─── Status Badge Config ─────────────────────────────────────────────────────

function getStatusConfig(entry: NetworkEntry): {
  label: string
  color: string
  bgColor: string
  rowBg: string
} {
  if (entry.state === NetworkState.pending) {
    return {
      label: '…',
      color: DarkTheme.warning,
      bgColor: DarkTheme.warningDim,
      rowBg: 'transparent',
    }
  }

  if (entry.state === NetworkState.error) {
    return {
      label: 'ERR',
      color: DarkTheme.error,
      bgColor: DarkTheme.errorDim,
      rowBg: 'rgba(255, 77, 106, 0.06)',
    }
  }

  const status = entry.status ?? 0

  if (status >= 200 && status < 300) {
    return {
      label: String(status),
      color: DarkTheme.success,
      bgColor: 'rgba(52, 211, 153, 0.12)',
      rowBg: 'transparent',
    }
  }

  if (status >= 300 && status < 400) {
    return {
      label: String(status),
      color: DarkTheme.info,
      bgColor: DarkTheme.infoDim,
      rowBg: 'transparent',
    }
  }

  if (status >= 400 && status < 500) {
    return {
      label: String(status),
      color: DarkTheme.warning,
      bgColor: DarkTheme.warningDim,
      rowBg: 'rgba(255, 178, 36, 0.06)',
    }
  }

  // 5xx
  return {
    label: String(status),
    color: DarkTheme.error,
    bgColor: DarkTheme.errorDim,
    rowBg: 'rgba(255, 77, 106, 0.06)',
  }
}

// ─── Method Badge Colors ─────────────────────────────────────────────────────

function getMethodColor(method: string): string {
  switch (method) {
    case 'GET':
      return DarkTheme.success
    case 'POST':
      return DarkTheme.info
    case 'PUT':
    case 'PATCH':
      return DarkTheme.warning
    case 'DELETE':
      return DarkTheme.error
    default:
      return DarkTheme.textSecondary
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

export const NetworkItem: React.FC<NetworkItemProps> = React.memo(({ item, onCopy }) => {
  const [expanded, setExpanded] = useState(false)
  const [detailSection, setDetailSection] = useState<'general' | 'request' | 'response'>('general')

  const config = getStatusConfig(item)
  const methodColor = getMethodColor(item.method)
  const isPending = item.state === NetworkState.pending

  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  const handleCopyCurl = useCallback(() => {
    if (onCopy) {
      onCopy(toCurl(item))
    }
  }, [item, onCopy])

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: config.rowBg }]}
      onPress={toggleExpand}
      onLongPress={handleCopyCurl}
      activeOpacity={0.7}
    >
      {/* ── Collapsed Row ─────────────────────────────────────── */}
      <View style={styles.headerRow}>
        {/* Method badge */}
        <View style={[styles.methodBadge, { borderColor: methodColor }]}>
          <Text style={[styles.methodText, { color: methodColor }]}>{item.method}</Text>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>

        {/* Duration */}
        {!isPending && <Text style={styles.duration}>{formatDuration(item.duration)}</Text>}
        {isPending && <Text style={[styles.duration, { color: DarkTheme.warning }]}>pending</Text>}

        {/* Size */}
        {item.responseSize !== undefined && (
          <Text style={styles.size}>{formatSize(item.responseSize)}</Text>
        )}

        {/* Timestamp */}
        <Text style={styles.timestamp}>{formatTimestamp(item.startTime)}</Text>
      </View>

      {/* URL */}
      <Text style={styles.path} numberOfLines={expanded ? undefined : 1}>
        {extractPath(item.url)}
      </Text>
      <Text style={styles.host} numberOfLines={1}>
        {extractHost(item.url)}
      </Text>

      {/* Error message */}
      {item.error && (
        <Text style={styles.errorText} numberOfLines={expanded ? undefined : 1}>
          ✕ {item.error}
        </Text>
      )}

      {/* ── Expanded Detail ───────────────────────────────────── */}
      {expanded && (
        <View style={styles.detailContainer}>
          {/* Section tabs */}
          <View style={styles.sectionTabs}>
            {(['general', 'request', 'response'] as const).map(section => (
              <TouchableOpacity
                key={section}
                style={[styles.sectionTab, detailSection === section && styles.sectionTabActive]}
                onPress={() => setDetailSection(section)}
              >
                <Text
                  style={[
                    styles.sectionTabText,
                    detailSection === section && styles.sectionTabTextActive,
                  ]}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Section content */}
          {detailSection === 'general' && (
            <View style={styles.sectionContent}>
              <DetailRow label="Method" value={item.method} />
              <DetailRow label="URL" value={item.url} selectable />
              <DetailRow
                label="Status"
                value={item.status ? `${item.status} ${item.statusText || ''}` : '—'}
              />
              <DetailRow label="Duration" value={formatDuration(item.duration)} />
              {item.responseSize !== undefined && (
                <DetailRow label="Size" value={formatSize(item.responseSize)} />
              )}
              {item.error && <DetailRow label="Error" value={item.error} isError />}
            </View>
          )}

          {detailSection === 'request' && (
            <View style={styles.sectionContent}>
              {item.requestHeaders && Object.keys(item.requestHeaders).length > 0 ? (
                <>
                  <Text style={styles.subsectionTitle}>HEADERS</Text>
                  <View style={styles.jsonContainer}>
                    <JsonTreeView data={item.requestHeaders} hideRoot maxDepth={3} />
                  </View>
                </>
              ) : (
                <Text style={styles.emptyNote}>No request headers captured</Text>
              )}
              {item.requestBody ? (
                <>
                  <Text style={styles.subsectionTitle}>BODY</Text>
                  {tryParseJSON(item.requestBody) ? (
                    <View style={styles.jsonContainer}>
                      <JsonTreeView data={tryParseJSON(item.requestBody)} hideRoot maxDepth={5} />
                    </View>
                  ) : (
                    <Text style={styles.bodyText} selectable>
                      {item.requestBody}
                    </Text>
                  )}
                </>
              ) : null}
            </View>
          )}

          {detailSection === 'response' && (
            <View style={styles.sectionContent}>
              {item.responseHeaders && Object.keys(item.responseHeaders).length > 0 ? (
                <>
                  <Text style={styles.subsectionTitle}>HEADERS</Text>
                  <View style={styles.jsonContainer}>
                    <JsonTreeView data={item.responseHeaders} hideRoot maxDepth={3} />
                  </View>
                </>
              ) : (
                <Text style={styles.emptyNote}>No response headers captured</Text>
              )}
              {item.responseBody ? (
                <>
                  <Text style={styles.subsectionTitle}>BODY</Text>
                  {tryParseJSON(item.responseBody) ? (
                    <View style={styles.jsonContainer}>
                      <JsonTreeView data={tryParseJSON(item.responseBody)} hideRoot maxDepth={5} />
                    </View>
                  ) : (
                    <Text style={styles.bodyText} selectable>
                      {item.responseBody}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.emptyNote}>
                  {isPending ? 'Awaiting response…' : 'No response body'}
                </Text>
              )}
            </View>
          )}

          {/* Copy as cURL */}
          {onCopy && (
            <TouchableOpacity
              style={styles.curlButton}
              onPress={handleCopyCurl}
              activeOpacity={0.7}
            >
              <Text style={styles.curlButtonText}>⧉ Copy as cURL</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Expand hint */}
      {!expanded && <Text style={styles.expandHint}>tap to inspect ▾</Text>}
    </TouchableOpacity>
  )
})

// ─── Detail Row ──────────────────────────────────────────────────────────────

const DetailRow: React.FC<{
  label: string
  value: string
  selectable?: boolean
  isError?: boolean
}> = ({ label, value, selectable, isError }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text
      style={[styles.detailValue, isError && { color: DarkTheme.error }]}
      numberOfLines={3}
      selectable={selectable}
    >
      {value}
    </Text>
  </View>
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
    gap: 6,
  },
  methodBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  methodText: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  duration: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    color: DarkTheme.textMuted,
  },
  size: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    color: DarkTheme.textMuted,
    opacity: 0.7,
  },
  timestamp: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    color: DarkTheme.textMuted,
    marginLeft: 'auto',
  },
  path: {
    fontFamily: MonospaceFont,
    fontSize: 12,
    color: DarkTheme.text,
    lineHeight: 18,
  },
  host: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    color: DarkTheme.textMuted,
    marginTop: 1,
  },
  errorText: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    color: DarkTheme.error,
    marginTop: 4,
  },
  expandHint: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    color: DarkTheme.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // ── Detail Section ──────────────────────────────
  detailContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.border,
  },
  sectionTabs: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  sectionTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: DarkTheme.surfaceElevated,
    borderWidth: 1,
    borderColor: DarkTheme.border,
  },
  sectionTabActive: {
    backgroundColor: DarkTheme.accentDim,
    borderColor: DarkTheme.accent,
  },
  sectionTabText: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    fontWeight: '600',
    color: DarkTheme.textMuted,
  },
  sectionTabTextActive: {
    color: DarkTheme.accent,
  },
  sectionContent: {
    marginBottom: 8,
  },
  subsectionTitle: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    fontWeight: '700',
    color: DarkTheme.textMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 8,
  },
  jsonContainer: {
    backgroundColor: DarkTheme.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DarkTheme.border,
    padding: 8,
  },
  bodyText: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    color: DarkTheme.text,
    lineHeight: 16,
    backgroundColor: DarkTheme.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DarkTheme.border,
    padding: 8,
    overflow: 'hidden',
  },
  emptyNote: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    color: DarkTheme.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  detailLabel: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    color: DarkTheme.textMuted,
    width: 70,
  },
  detailValue: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    color: DarkTheme.text,
    flex: 1,
  },
  curlButton: {
    marginTop: 10,
    backgroundColor: DarkTheme.accentDim,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DarkTheme.accent,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  curlButtonText: {
    fontFamily: MonospaceFont,
    fontSize: 12,
    fontWeight: '700',
    color: DarkTheme.accent,
  },
})
