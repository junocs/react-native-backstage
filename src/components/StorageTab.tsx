import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { MonospaceFont } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import { JsonTreeView } from './JsonTreeView'
import type { StorageAdapter, BackstageTheme } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StorageTabProps {
  adapter: StorageAdapter
  jsonMaxDepth?: number
}

interface StorageEntry {
  key: string
  value: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tryParseJSON(text: string): unknown | null {
  try {
    const parsed = JSON.parse(text)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

function truncateValue(value: string, max = 80): string {
  if (value.length <= max) return value
  return value.substring(0, max) + '…'
}

// ─── Component ───────────────────────────────────────────────────────────────

export const StorageTab: React.FC<StorageTabProps> = ({ adapter, jsonMaxDepth }) => {
  const theme = useBackstageTheme()
  const s = useMemo(() => createStyles(theme), [theme])

  const [entries, setEntries] = useState<StorageEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')

  // Edit state
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Add new entry state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  // Expanded entries (for JSON preview)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  // ─── Load Entries ────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    setLoading(true)
    try {
      const keys = await adapter.getAllKeys()
      const sorted = [...keys].sort((a, b) => a.localeCompare(b))
      const results: StorageEntry[] = []
      for (const key of sorted) {
        const value = await adapter.getItem(key)
        results.push({ key, value: value ?? '' })
      }
      setEntries(results)
    } catch (err) {
      console.error('[Backstage] StorageTab load error:', err)
    } finally {
      setLoading(false)
    }
  }, [adapter])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // ─── Filter ──────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    if (!searchText.trim()) return entries
    const query = searchText.toLowerCase()
    return entries.filter(
      e => e.key.toLowerCase().includes(query) || e.value.toLowerCase().includes(query),
    )
  }, [entries, searchText])

  // ─── Toggle Expand ───────────────────────────────────────
  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  // ─── Edit ────────────────────────────────────────────────
  const startEditing = useCallback((entry: StorageEntry) => {
    setEditingKey(entry.key)
    setEditValue(entry.value)
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingKey(null)
    setEditValue('')
  }, [])

  const saveEdit = useCallback(async () => {
    if (editingKey === null) return
    try {
      await adapter.setItem(editingKey, editValue)
      setEntries(prev => prev.map(e => (e.key === editingKey ? { ...e, value: editValue } : e)))
      setEditingKey(null)
      setEditValue('')
    } catch (err) {
      Alert.alert('Error', `Failed to save: ${err}`)
    }
  }, [adapter, editingKey, editValue])

  // ─── Delete ──────────────────────────────────────────────
  const confirmDelete = useCallback(
    (key: string) => {
      Alert.alert('Delete Entry', `Remove "${key}" from storage?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adapter.removeItem(key)
              setEntries(prev => prev.filter(e => e.key !== key))
              setExpandedKeys(prev => {
                const next = new Set(prev)
                next.delete(key)
                return next
              })
            } catch (err) {
              Alert.alert('Error', `Failed to delete: ${err}`)
            }
          },
        },
      ])
    },
    [adapter],
  )

  // ─── Add New Entry ───────────────────────────────────────
  const handleAddEntry = useCallback(async () => {
    const trimmedKey = newKey.trim()
    if (!trimmedKey) {
      Alert.alert('Error', 'Key cannot be empty')
      return
    }
    try {
      await adapter.setItem(trimmedKey, newValue)
      setEntries(prev => {
        const exists = prev.findIndex(e => e.key === trimmedKey)
        if (exists >= 0) {
          const updated = [...prev]
          updated[exists] = { key: trimmedKey, value: newValue }
          return updated
        }
        return [...prev, { key: trimmedKey, value: newValue }].sort((a, b) =>
          a.key.localeCompare(b.key),
        )
      })
      setNewKey('')
      setNewValue('')
      setShowAddForm(false)
    } catch (err) {
      Alert.alert('Error', `Failed to save: ${err}`)
    }
  }, [adapter, newKey, newValue])

  // ─── Render Entry ────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: StorageEntry }) => {
      const isEditing = editingKey === item.key
      const isExpanded = expandedKeys.has(item.key)
      const jsonValue = tryParseJSON(item.value)
      const isJSON = jsonValue !== null

      return (
        <View style={s.entryContainer}>
          {/* Key row */}
          <View style={s.entryHeader}>
            <TouchableOpacity
              style={s.entryKeyContainer}
              onPress={() => toggleExpand(item.key)}
              activeOpacity={0.7}
            >
              <Text style={s.entryChevron}>{isExpanded ? '▼' : '▶'}</Text>
              <Text style={s.entryKey} numberOfLines={1}>
                {item.key}
              </Text>
              {isJSON && <Text style={s.jsonBadge}>JSON</Text>}
            </TouchableOpacity>
            <View style={s.entryActions}>
              <TouchableOpacity
                onPress={() => startEditing(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={s.actionIcon}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDelete(item.key)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[s.actionIcon, s.deleteIcon]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Value */}
          {isEditing ? (
            <View style={s.editContainer}>
              <TextInput
                style={s.editInput}
                value={editValue}
                onChangeText={setEditValue}
                multiline
                autoFocus
                textAlignVertical="top"
                placeholderTextColor={theme.textMuted}
                placeholder="Value"
              />
              <View style={s.editActions}>
                <TouchableOpacity style={s.cancelButton} onPress={cancelEditing}>
                  <Text style={s.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveButton} onPress={saveEdit}>
                  <Text style={s.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : isExpanded ? (
            <View style={s.expandedValue}>
              {isJSON ? (
                <View style={s.jsonContainer}>
                  <JsonTreeView data={jsonValue} hideRoot maxDepth={jsonMaxDepth} />
                </View>
              ) : (
                <Text style={s.valueText} selectable>
                  {item.value || '(empty)'}
                </Text>
              )}
            </View>
          ) : (
            <TouchableOpacity onPress={() => toggleExpand(item.key)} activeOpacity={0.7}>
              <Text style={s.valuePreview} numberOfLines={1}>
                {truncateValue(item.value) || '(empty)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )
    },
    [
      editingKey,
      editValue,
      expandedKeys,
      jsonMaxDepth,
      s,
      theme.textMuted,
      toggleExpand,
      startEditing,
      cancelEditing,
      saveEdit,
      confirmDelete,
    ],
  )

  const keyExtractor = useCallback((item: StorageEntry) => item.key, [])

  return (
    <View style={s.container}>
      {/* Search + Add bar */}
      <View style={s.searchContainer}>
        <View style={s.searchInputWrapper}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Filter by key or value..."
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
          style={s.addButton}
          onPress={() => setShowAddForm(prev => !prev)}
          activeOpacity={0.7}
        >
          <Text style={s.addButtonText}>{showAddForm ? '✕' : '＋'}</Text>
        </TouchableOpacity>
      </View>

      {/* Add form */}
      {showAddForm && (
        <View style={s.addForm}>
          <TextInput
            style={s.addInput}
            placeholder="Key"
            placeholderTextColor={theme.textMuted}
            value={newKey}
            onChangeText={setNewKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[s.addInput, s.addValueInput]}
            placeholder="Value"
            placeholderTextColor={theme.textMuted}
            value={newValue}
            onChangeText={setNewValue}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity style={s.addSubmitButton} onPress={handleAddEntry} activeOpacity={0.7}>
            <Text style={s.addSubmitText}>Add Entry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      <View style={s.statsBar}>
        <Text style={s.statText}>
          {filteredEntries.length === entries.length
            ? `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`
            : `${filteredEntries.length} of ${entries.length}`}
        </Text>
        <Text style={s.pullHint}>↓ pull to refresh</Text>
      </View>

      {/* List */}
      <FlatList
        data={filteredEntries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={loading}
        onRefresh={loadEntries}
        style={s.list}
        contentContainerStyle={filteredEntries.length === 0 ? s.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🗄</Text>
            <Text style={s.emptyTitle}>{loading ? 'Loading…' : 'No entries'}</Text>
            <Text style={s.emptySubtitle}>
              {loading ? 'Reading storage keys' : 'Storage is empty or no entries match'}
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

    // ── Search ─────────────────────
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
    addButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: t.accentDim,
      borderWidth: 1,
      borderColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: { fontSize: 18, color: t.accent, fontWeight: '700' },

    // ── Add Form ───────────────────
    addForm: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      backgroundColor: t.surface,
      gap: 8,
    },
    addInput: {
      fontFamily: MonospaceFont,
      fontSize: 13,
      color: t.text,
      backgroundColor: t.surfaceElevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    addValueInput: { minHeight: 60 },
    addSubmitButton: {
      backgroundColor: t.accent,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    addSubmitText: {
      fontFamily: MonospaceFont,
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // ── Stats ──────────────────────
    statsBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: t.surface,
    },
    statText: { fontFamily: MonospaceFont, fontSize: 11, color: t.textMuted },
    pullHint: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      color: t.textMuted,
      fontStyle: 'italic',
    },

    // ── List ───────────────────────
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

    // ── Entry ──────────────────────
    entryContainer: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    entryKeyContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    entryChevron: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      color: t.textMuted,
      marginRight: 6,
      width: 12,
    },
    entryKey: {
      fontFamily: MonospaceFont,
      fontSize: 13,
      fontWeight: '700',
      color: t.text,
      flex: 1,
    },
    jsonBadge: {
      fontFamily: MonospaceFont,
      fontSize: 9,
      fontWeight: '800',
      color: t.info,
      backgroundColor: t.infoDim,
      borderRadius: 3,
      paddingHorizontal: 5,
      paddingVertical: 1,
      marginLeft: 6,
      overflow: 'hidden',
    },
    entryActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 8 },
    actionIcon: {
      fontSize: 16,
      color: t.textMuted,
    },
    deleteIcon: { color: t.error },

    // ── Value Preview ──────────────
    valuePreview: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      color: t.textSecondary,
      paddingLeft: 18,
      lineHeight: 18,
    },
    expandedValue: { marginTop: 4, paddingLeft: 18 },
    valueText: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      color: t.text,
      lineHeight: 18,
    },
    jsonContainer: {
      backgroundColor: t.surfaceElevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
      padding: 8,
    },

    // ── Edit ───────────────────────
    editContainer: {
      marginTop: 6,
      paddingLeft: 18,
      gap: 8,
    },
    editInput: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      color: t.text,
      backgroundColor: t.surfaceElevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.accent,
      paddingHorizontal: 10,
      paddingVertical: 8,
      minHeight: 60,
      lineHeight: 18,
    },
    editActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
    cancelButton: {
      borderRadius: 6,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    cancelButtonText: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      fontWeight: '600',
      color: t.textSecondary,
    },
    saveButton: {
      borderRadius: 6,
      backgroundColor: t.accent,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    saveButtonText: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  })
