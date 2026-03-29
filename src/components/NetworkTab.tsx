import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { MonospaceFont, TestIDs } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import { NetworkState } from '../types'
import type { NetworkEntry, BackstageTheme } from '../types'
import { NetworkItem } from './NetworkItem'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NetworkTabProps {
  entries: NetworkEntry[]
  onRefresh: () => void
  onClear: () => void
  onCopy?: (text: string) => void
  jsonMaxDepth?: number
}

// ─── Component ───────────────────────────────────────────────────────────────

export const NetworkTab: React.FC<NetworkTabProps> = ({
  entries,
  onRefresh,
  onClear,
  onCopy,
  jsonMaxDepth,
}) => {
  const theme = useBackstageTheme()
  const s = useMemo(() => createStyles(theme), [theme])
  const [searchText, setSearchText] = useState('')

  const filteredEntries = useMemo(() => {
    if (!searchText.trim()) return entries
    const query = searchText.toLowerCase()
    return entries.filter(entry => {
      return (
        entry.url.toLowerCase().includes(query) ||
        entry.method.toLowerCase().includes(query) ||
        (entry.status !== undefined && String(entry.status).includes(query)) ||
        (entry.error && entry.error.toLowerCase().includes(query))
      )
    })
  }, [entries, searchText])

  const stats = useMemo(() => {
    const total = entries.length
    const errors = entries.filter(
      e => e.state === NetworkState.error || (e.status !== undefined && e.status >= 400),
    ).length
    const pending = entries.filter(e => e.state === NetworkState.pending).length
    const completed = entries.filter(
      e => e.state === NetworkState.completed && e.duration !== undefined,
    )
    const avgDuration =
      completed.length > 0
        ? Math.round(completed.reduce((sum, e) => sum + (e.duration ?? 0), 0) / completed.length)
        : 0
    return { total, errors, pending, avgDuration }
  }, [entries])

  const renderItem = useCallback(
    ({ item }: { item: NetworkEntry }) => (
      <NetworkItem item={item} onCopy={onCopy} jsonMaxDepth={jsonMaxDepth} />
    ),
    [onCopy],
  )

  const keyExtractor = useCallback((item: NetworkEntry) => item.id, [])

  return (
    <View style={s.container}>
      <View style={s.searchContainer}>
        <View style={s.searchInputWrapper}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            testID={TestIDs.networkTab.searchInput}
            style={s.searchInput}
            placeholder="Filter by URL, method, status..."
            placeholderTextColor={theme.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          testID={TestIDs.networkTab.clearButton}
          style={s.clearButton}
          onPress={onClear}
          activeOpacity={0.7}
        >
          <Text style={s.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsBar}>
        <View style={s.statsRow}>
          <Text style={s.statText}>
            {filteredEntries.length === entries.length
              ? `${stats.total} request${stats.total !== 1 ? 's' : ''}`
              : `${filteredEntries.length} of ${stats.total}`}
          </Text>
          {stats.errors > 0 && (
            <View style={s.statBadge}>
              <Text style={s.statBadgeError}>
                {stats.errors} error{stats.errors !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {stats.pending > 0 && (
            <View style={[s.statBadge, s.statBadgePending]}>
              <Text style={s.statBadgePendingText}>{stats.pending} pending</Text>
            </View>
          )}
        </View>
        {stats.avgDuration > 0 && <Text style={s.avgText}>avg {stats.avgDuration}ms</Text>}
      </View>

      <FlatList
        testID={TestIDs.networkTab.list}
        data={filteredEntries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={false}
        onRefresh={onRefresh}
        style={s.list}
        contentContainerStyle={filteredEntries.length === 0 ? s.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🌐</Text>
            <Text style={s.emptyTitle}>No network requests</Text>
            <Text style={s.emptySubtitle}>
              HTTP requests made via fetch or XMLHttpRequest will appear here
            </Text>
          </View>
        }
        maxToRenderPerBatch={20}
        windowSize={10}
        initialNumToRender={20}
        removeClippedSubviews={true}
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
    clearButton: {
      backgroundColor: t.errorDim,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.error,
      paddingHorizontal: 14,
      height: 38,
      justifyContent: 'center',
    },
    clearButtonText: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      fontWeight: '700',
      color: t.error,
      letterSpacing: 0.5,
    },
    statsBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: t.surface,
    },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statText: { fontFamily: MonospaceFont, fontSize: 11, color: t.textMuted },
    statBadge: {
      backgroundColor: t.errorDim,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    statBadgeError: { fontFamily: MonospaceFont, fontSize: 10, fontWeight: '700', color: t.error },
    statBadgePending: { backgroundColor: t.warningDim },
    statBadgePendingText: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      fontWeight: '700',
      color: t.warning,
    },
    avgText: { fontFamily: MonospaceFont, fontSize: 10, color: t.textMuted, fontStyle: 'italic' },
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
      lineHeight: 20,
    },
  })
