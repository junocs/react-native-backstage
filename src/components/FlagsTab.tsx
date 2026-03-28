import React, { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { DarkTheme, MonospaceFont } from '../constants'
import type { FeatureFlag } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlagsTabProps {
  flags: FeatureFlag[]
  onToggle?: (key: string, value: boolean) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export const FlagsTab: React.FC<FlagsTabProps> = ({ flags, onToggle }) => {
  const [searchText, setSearchText] = useState('')

  const filteredFlags = useMemo(() => {
    if (!searchText.trim()) return flags
    const query = searchText.toLowerCase()
    return flags.filter(
      f =>
        f.label.toLowerCase().includes(query) ||
        f.key.toLowerCase().includes(query) ||
        (f.description && f.description.toLowerCase().includes(query)),
    )
  }, [flags, searchText])

  // Stats
  const enabledCount = flags.filter(f => f.value).length

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Filter flags..."
            placeholderTextColor={DarkTheme.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statText}>
          {filteredFlags.length === flags.length
            ? `${flags.length} flag${flags.length !== 1 ? 's' : ''}`
            : `${filteredFlags.length} of ${flags.length}`}
        </Text>
        <Text style={styles.statText}>
          <Text style={styles.statEnabled}>{enabledCount} on</Text>
          {' · '}
          <Text style={styles.statDisabled}>{flags.length - enabledCount} off</Text>
        </Text>
      </View>

      {/* Flag List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={
          filteredFlags.length === 0 ? styles.emptyContainer : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredFlags.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎚</Text>
            <Text style={styles.emptyTitle}>No flags match</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search</Text>
          </View>
        ) : (
          filteredFlags.map((flag, index) => (
            <View key={flag.key}>
              <View style={styles.flagRow}>
                <View style={styles.flagInfo}>
                  <View style={styles.flagHeader}>
                    <Text style={styles.flagLabel}>{flag.label}</Text>
                    <Text style={[styles.flagKey, flag.value && styles.flagKeyActive]}>
                      {flag.key}
                    </Text>
                  </View>
                  {flag.description && (
                    <Text style={styles.flagDescription}>{flag.description}</Text>
                  )}
                </View>
                <Switch
                  testID={`backstage.flag.${flag.key}`}
                  value={flag.value}
                  onValueChange={(newValue: boolean) => onToggle?.(flag.key, newValue)}
                  trackColor={{ false: DarkTheme.border, true: DarkTheme.accent }}
                  thumbColor={flag.value ? '#FFFFFF' : DarkTheme.textMuted}
                  ios_backgroundColor={DarkTheme.border}
                />
              </View>
              {index < filteredFlags.length - 1 && <View style={styles.divider} />}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.border,
  },
  searchInputWrapper: {
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: DarkTheme.surface,
  },
  statText: {
    fontFamily: MonospaceFont,
    fontSize: 11,
    color: DarkTheme.textMuted,
  },
  statEnabled: {
    color: DarkTheme.success,
    fontWeight: '700',
  },
  statDisabled: {
    color: DarkTheme.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  flagInfo: {
    flex: 1,
    marginRight: 16,
  },
  flagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagLabel: {
    fontFamily: MonospaceFont,
    fontSize: 14,
    color: DarkTheme.text,
    fontWeight: '600',
  },
  flagKey: {
    fontFamily: MonospaceFont,
    fontSize: 10,
    color: DarkTheme.textMuted,
    backgroundColor: DarkTheme.surfaceElevated,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  flagKeyActive: {
    color: DarkTheme.accent,
    backgroundColor: DarkTheme.accentDim,
  },
  flagDescription: {
    fontFamily: MonospaceFont,
    fontSize: 12,
    color: DarkTheme.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: DarkTheme.border,
    marginHorizontal: 4,
  },
})
