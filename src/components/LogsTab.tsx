import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { DarkTheme, MonospaceFont, TestIDs } from '../constants'
import type { LogEntry, BackstageStyleOverrides } from '../types'
import { LogItem } from './LogItem'
import { formatTimestamp } from '../utils/formatTimestamp'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogsTabProps {
  logs: LogEntry[]
  onRefresh: () => void
  onCopyLogs?: (logs: string) => void
  styles?: BackstageStyleOverrides
}

// ─── Component ───────────────────────────────────────────────────────────────

export const LogsTab: React.FC<LogsTabProps> = ({
  logs,
  onRefresh,
  onCopyLogs,
  styles: propStyles,
}) => {
  const [searchText, setSearchText] = useState('')

  // Filter logs based on search text
  const filteredLogs = useMemo(() => {
    if (!searchText.trim()) return logs

    const query = searchText.toLowerCase()
    return logs.filter(log => {
      return log.message.toLowerCase().includes(query) || log.level.toLowerCase().includes(query)
    })
  }, [logs, searchText])

  // Copy all visible logs to text
  const handleCopyAll = useCallback(() => {
    if (!onCopyLogs) return

    const text = filteredLogs
      .map(log => `[${log.level.toUpperCase()}] ${formatTimestamp(log.timestamp)} ${log.message}`)
      .join('\n')
    onCopyLogs(text)
  }, [filteredLogs, onCopyLogs])

  // Copy individual log
  const handleCopyItem = useCallback(
    (text: string) => {
      if (onCopyLogs) {
        onCopyLogs(text)
      }
    },
    [onCopyLogs],
  )

  // Render log item
  const renderItem = useCallback(
    ({ item }: { item: LogEntry }) => (
      <LogItem item={item} onCopy={onCopyLogs ? handleCopyItem : undefined} styles={propStyles} />
    ),
    [handleCopyItem, onCopyLogs, propStyles],
  )

  const keyExtractor = useCallback((item: LogEntry) => item.id, [])

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            testID={TestIDs.logsTab.searchInput}
            style={styles.searchInput}
            placeholder="Filter logs..."
            placeholderTextColor={DarkTheme.textMuted}
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
            style={styles.copyAllButton}
            onPress={handleCopyAll}
            activeOpacity={0.7}
          >
            <Text style={styles.copyAllText}>Copy All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Log Count */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          {filteredLogs.length === logs.length
            ? `${logs.length} log${logs.length !== 1 ? 's' : ''}`
            : `${filteredLogs.length} of ${logs.length} logs`}
        </Text>
        <Text style={styles.pullHint}>↓ pull to refresh</Text>
      </View>

      {/* Log List */}
      <FlatList
        testID={TestIDs.logsTab.list}
        data={filteredLogs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={false}
        onRefresh={onRefresh}
        style={styles.list}
        contentContainerStyle={filteredLogs.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No logs yet</Text>
            <Text style={styles.emptySubtitle}>Console output will appear here</Text>
          </View>
        }
        // Perf optimizations
        maxToRenderPerBatch={20}
        windowSize={10}
        initialNumToRender={20}
        removeClippedSubviews={true}
        getItemLayout={undefined}
      />
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.border,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkTheme.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DarkTheme.border,
    paddingHorizontal: 12,
    height: 38,
  },
  searchIcon: {
    fontSize: 16,
    color: DarkTheme.textMuted,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: MonospaceFont,
    fontSize: 13,
    color: DarkTheme.text,
    padding: 0,
  },
  copyAllButton: {
    backgroundColor: DarkTheme.accentDim,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DarkTheme.accent,
    paddingHorizontal: 14,
    height: 38,
    justifyContent: 'center',
  },
  copyAllText: {
    fontFamily: MonospaceFont,
    fontSize: 12,
    fontWeight: '700',
    color: DarkTheme.accent,
    letterSpacing: 0.5,
  },
  countBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: DarkTheme.surface,
  },
  countText: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    color: DarkTheme.textMuted,
  },
  pullHint: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    color: DarkTheme.textMuted,
    fontStyle: 'italic',
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontFamily: MonospaceFont,
    fontSize: 16,
    fontWeight: '700',
    color: DarkTheme.textSecondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: MonospaceFont,
    fontSize: 13,
    color: DarkTheme.textMuted,
    textAlign: 'center',
  },
})
