import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { MonospaceFont, TestIDs } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import type { LogEntry, BackstageStyleOverrides, BackstageTheme } from '../types'
import { LogItem } from './LogItem'
import { formatTimestamp } from '../utils/formatTimestamp'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogsTabProps {
  logs: LogEntry[]
  onRefresh: () => void
  onCopyLogs?: (logs: string) => void
  jsonMaxDepth?: number
  styles?: BackstageStyleOverrides
}

// ─── Component ───────────────────────────────────────────────────────────────

export const LogsTab: React.FC<LogsTabProps> = ({
  logs,
  onRefresh,
  onCopyLogs,
  jsonMaxDepth,
  styles: propStyles,
}) => {
  const theme = useBackstageTheme()
  const s = useMemo(() => createStyles(theme), [theme])
  const [searchText, setSearchText] = useState('')

  const filteredLogs = useMemo(() => {
    if (!searchText.trim()) return logs
    const query = searchText.toLowerCase()
    return logs.filter(log => {
      return log.message.toLowerCase().includes(query) || log.level.toLowerCase().includes(query)
    })
  }, [logs, searchText])

  const handleCopyAll = useCallback(() => {
    if (!onCopyLogs) return
    const text = filteredLogs
      .map(log => `[${log.level.toUpperCase()}] ${formatTimestamp(log.timestamp)} ${log.message}`)
      .join('\n')
    onCopyLogs(text)
  }, [filteredLogs, onCopyLogs])

  const handleCopyItem = useCallback(
    (text: string) => {
      if (onCopyLogs) {
        onCopyLogs(text)
      }
    },
    [onCopyLogs],
  )

  const renderItem = useCallback(
    ({ item }: { item: LogEntry }) => (
      <LogItem
        item={item}
        onCopy={onCopyLogs ? handleCopyItem : undefined}
        jsonMaxDepth={jsonMaxDepth}
        styles={propStyles}
      />
    ),
    [handleCopyItem, onCopyLogs, propStyles],
  )

  const keyExtractor = useCallback((item: LogEntry) => item.id, [])

  return (
    <View testID={TestIDs.logsTab.container} style={s.container}>
      <View style={s.searchContainer}>
        <View style={s.searchInputWrapper}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            testID={TestIDs.logsTab.searchInput}
            style={s.searchInput}
            placeholder="Filter logs..."
            placeholderTextColor={theme.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
        {onCopyLogs && (
          <TouchableOpacity
            testID={TestIDs.logsTab.copyButton}
            style={s.copyAllButton}
            onPress={handleCopyAll}
            activeOpacity={0.7}
          >
            <Text style={s.copyAllText}>Copy All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View testID={TestIDs.logsTab.statsBar} style={s.countBar}>
        <Text style={s.countText}>
          {filteredLogs.length === logs.length
            ? `${logs.length} log${logs.length !== 1 ? 's' : ''}`
            : `${filteredLogs.length} of ${logs.length} logs`}
        </Text>
        <Text style={s.pullHint}>↓ pull to refresh</Text>
      </View>

      <FlatList
        testID={TestIDs.logsTab.list}
        data={filteredLogs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={false}
        onRefresh={onRefresh}
        style={s.list}
        contentContainerStyle={filteredLogs.length === 0 ? s.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>No logs yet</Text>
            <Text style={s.emptySubtitle}>Console output will appear here</Text>
          </View>
        }
        maxToRenderPerBatch={20}
        windowSize={10}
        initialNumToRender={20}
      />
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (t: BackstageTheme) =>
  StyleSheet.create({
    container: { flex: 1 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    searchInputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surfaceElevated,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 12,
      height: 38,
    },
    searchIcon: { fontSize: 16, color: t.textMuted, marginRight: 8 },
    searchInput: {
      flex: 1,
      fontFamily: MonospaceFont,
      fontSize: 13,
      color: t.text,
      padding: 0,
    },
    copyAllButton: {
      backgroundColor: t.accentDim,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.accent,
      paddingHorizontal: 14,
      height: 38,
      justifyContent: 'center',
    },
    copyAllText: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      fontWeight: '700',
      color: t.accent,
      letterSpacing: 0.5,
    },
    countBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: t.surface,
    },
    countText: { fontFamily: MonospaceFont, fontSize: 11, color: t.textMuted },
    pullHint: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      color: t.textMuted,
      fontStyle: 'italic',
    },
    list: { flex: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center' },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.5 },
    emptyTitle: {
      fontFamily: MonospaceFont,
      fontSize: 16,
      fontWeight: '700',
      color: t.textSecondary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontFamily: MonospaceFont,
      fontSize: 13,
      color: t.textMuted,
      textAlign: 'center',
    },
  })
