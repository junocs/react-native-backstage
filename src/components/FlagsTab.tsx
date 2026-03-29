import React, { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { MonospaceFont } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import type { FeatureFlag, BackstageTheme } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlagsTabProps {
  flags: FeatureFlag[]
  onToggle?: (key: string, value: boolean) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export const FlagsTab: React.FC<FlagsTabProps> = ({ flags, onToggle }) => {
  const theme = useBackstageTheme()
  const s = useMemo(() => createStyles(theme), [theme])
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

  const enabledCount = flags.filter(f => f.value).length

  return (
    <View style={s.container}>
      <View style={s.searchContainer}>
        <View style={s.searchInputWrapper}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Filter flags..."
            placeholderTextColor={theme.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={s.statsBar}>
        <Text style={s.statText}>
          {filteredFlags.length === flags.length
            ? `${flags.length} flag${flags.length !== 1 ? 's' : ''}`
            : `${filteredFlags.length} of ${flags.length}`}
        </Text>
        <Text style={s.statText}>
          <Text style={s.statEnabled}>{enabledCount} on</Text>
          {' · '}
          <Text style={s.statDisabled}>{flags.length - enabledCount} off</Text>
        </Text>
      </View>

      <ScrollView
        style={s.list}
        contentContainerStyle={filteredFlags.length === 0 ? s.emptyContainer : s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredFlags.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🎚</Text>
            <Text style={s.emptyTitle}>No flags match</Text>
            <Text style={s.emptySubtitle}>Try adjusting your search</Text>
          </View>
        ) : (
          filteredFlags.map((flag, index) => (
            <View key={flag.key}>
              <View style={s.flagRow}>
                <View style={s.flagInfo}>
                <View style={s.flagHeader}>
                    <Text style={s.flagLabel} numberOfLines={2}>{flag.label}</Text>
                  </View>
                  <Text style={[s.flagKey, flag.value && s.flagKeyActive]}>{flag.key}</Text>
                  {flag.description && <Text style={s.flagDescription}>{flag.description}</Text>}
                </View>
                <Switch
                  testID={`backstage.flag.${flag.key}`}
                  value={flag.value}
                  onValueChange={(newValue: boolean) => onToggle?.(flag.key, newValue)}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={flag.value ? '#FFFFFF' : theme.textMuted}
                  ios_backgroundColor={theme.border}
                />
              </View>
              {index < filteredFlags.length - 1 && <View style={s.divider} />}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (t: BackstageTheme) =>
  StyleSheet.create({
    container: { flex: 1 },
    searchContainer: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    searchInputWrapper: {
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
    statsBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: t.surface,
    },
    statText: { fontFamily: MonospaceFont, fontSize: 11, color: t.textMuted },
    statEnabled: { color: t.success, fontWeight: '700' },
    statDisabled: { color: t.textMuted },
    list: { flex: 1 },
    listContent: { paddingHorizontal: 16, paddingVertical: 8 },
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
    flagRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    flagInfo: { flex: 1, marginRight: 16 },
    flagHeader: { flexDirection: 'row', alignItems: 'center' },
    flagLabel: {
      fontFamily: MonospaceFont,
      fontSize: 14,
      color: t.text,
      fontWeight: '600',
    },
    flagKey: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      color: t.textMuted,
      backgroundColor: t.surfaceElevated,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 1,
      overflow: 'hidden',
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    flagKeyActive: { color: t.accent, backgroundColor: t.accentDim },
    flagDescription: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      color: t.textMuted,
      marginTop: 4,
      lineHeight: 18,
    },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 4 },
  })
