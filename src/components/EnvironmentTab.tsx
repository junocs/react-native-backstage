import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { MonospaceFont, TestIDs } from '../constants'
import { useBackstageTheme } from '../ThemeContext'
import type { BackstageTheme, EnvironmentConfig, SavedCredential } from '../types'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'backstage.env.credentials.'

// ─── Credential Editor Modal ─────────────────────────────────────────────────

interface EditorModalProps {
  visible: boolean
  title: string
  credentialName: string
  fieldValues: Record<string, string>
  credentialFields: EnvironmentConfig['credentialFields']
  onChangeName: (text: string) => void
  onChangeField: (fieldKey: string, value: string) => void
  onSave: () => void
  onCancel: () => void
  theme: BackstageTheme
}

const EditorModal: React.FC<EditorModalProps> = ({
  visible,
  title,
  credentialName,
  fieldValues,
  credentialFields = [],
  onChangeName,
  onChangeField,
  onSave,
  onCancel,
  theme,
}) => {
  const s = useMemo(() => createStyles(theme), [theme])

  return (
    <Modal
      testID={TestIDs.environmentTab.editorModal}
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <SafeAreaView style={s.modalContainer}>
        {/* Header */}
        <View style={s.modalHeader}>
          <TouchableOpacity
            testID={TestIDs.environmentTab.editorCancelButton}
            onPress={onCancel}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle} numberOfLines={1}>{title}</Text>
          <TouchableOpacity
            testID={TestIDs.environmentTab.editorSaveButton}
            onPress={onSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <KeyboardAvoidingView
          style={s.modalBody}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={s.modalBodyContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.modalLabel}>Name</Text>
            <TextInput
              testID={TestIDs.environmentTab.editorNameInput}
              style={s.modalInput}
              value={credentialName}
              onChangeText={onChangeName}
              placeholder="e.g., QA Account, Admin"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="words"
              autoFocus
            />

            {credentialFields.map(field => (
              <View key={field.key} style={{ marginTop: 16 }}>
                <Text style={s.modalLabel}>{field.label}</Text>
                <TextInput
                  testID={TestIDs.environmentTab.editorFieldInput(field.key)}
                  style={[s.modalInput, field.secureTextEntry ? undefined : undefined]}
                  value={fieldValues[field.key] || ''}
                  onChangeText={val => onChangeField(field.key, val)}
                  placeholder={field.placeholder || field.label}
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={field.secureTextEntry}
                  autoCapitalize={field.autoCapitalize ?? 'none'}
                  autoCorrect={false}
                  keyboardType={field.keyboardType}
                />
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

// ─── Credential Row ──────────────────────────────────────────────────────────

interface CredentialRowProps {
  envKey: string
  index: number
  credential: SavedCredential
  envColor: string
  onLogin: () => void
  onEdit: () => void
  onDelete: () => void
  loggingIn: boolean
  theme: BackstageTheme
}

const CredentialRow: React.FC<CredentialRowProps> = ({
  envKey,
  index,
  credential,
  envColor,
  onLogin,
  onEdit,
  onDelete,
  loggingIn,
  theme,
}) => {
  const s = useMemo(() => createStyles(theme), [theme])
  const fieldCount = Object.keys(credential.values).length

  return (
    <View testID={TestIDs.environmentTab.credentialRow(envKey, index)} style={s.credRow}>
      <View style={s.credRowLeft}>
        <Text style={s.credName} numberOfLines={1}>
          {credential.name}
        </Text>
        <Text style={s.credMeta}>
          {fieldCount} field{fieldCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={s.credRowActions}>
        <TouchableOpacity
          testID={TestIDs.environmentTab.credentialLogin(envKey, index)}
          style={[s.credActionButton, { backgroundColor: envColor }]}
          onPress={onLogin}
          disabled={loggingIn}
          activeOpacity={0.7}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          {loggingIn ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={s.credActionLoginText}>Login</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          testID={TestIDs.environmentTab.credentialEdit(envKey, index)}
          onPress={onEdit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.credActionIcon}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={TestIDs.environmentTab.credentialDelete(envKey, index)}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[s.credActionIcon, s.credDeleteIcon]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface EnvironmentTabProps {
  config: EnvironmentConfig
}

export const EnvironmentTab: React.FC<EnvironmentTabProps> = ({ config }) => {
  const {
    environments,
    activeEnvironment,
    onEnvironmentChange,
    credentialFields = [],
    onLogin,
    initialCredentials,
    storageAdapter,
  } = config

  const theme = useBackstageTheme()
  const s = useMemo(() => createStyles(theme), [theme])

  // ── Credentials state: Record<envKey, SavedCredential[]> ──
  const [credentials, setCredentials] = useState<Record<string, SavedCredential[]>>(() => {
    const init: Record<string, SavedCredential[]> = {}
    for (const env of environments) {
      init[env.key] = initialCredentials?.[env.key] ? [...initialCredentials[env.key]] : []
    }
    return init
  })

  const [loadingCredentials, setLoadingCredentials] = useState(!!storageAdapter)
  const [loggingInKey, setLoggingInKey] = useState<string | null>(null)

  // ── Editor modal state ─────────────────────────────────────
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorEnvKey, setEditorEnvKey] = useState('')
  const [editorIndex, setEditorIndex] = useState<number | null>(null) // null = add new
  const [editorName, setEditorName] = useState('')
  const [editorFields, setEditorFields] = useState<Record<string, string>>({})

  // ── Load persisted credentials on mount ────────────────────
  // Merges stored credentials with initialCredentials.
  // initialCredentials always take priority — deduplication uses values.email.
  useEffect(() => {
    if (!storageAdapter) return

    let cancelled = false

    const load = async () => {
      try {
        for (const env of environments) {
          const stored = await storageAdapter.getItem(STORAGE_KEY_PREFIX + env.key)
          if (stored && !cancelled) {
            try {
              const parsed = JSON.parse(stored) as SavedCredential[]
              if (Array.isArray(parsed)) {
                // Merge: initialCredentials take priority, matched by values.email
                const initial = initialCredentials?.[env.key] || []
                const initialEmails = new Set(
                  initial.map(c => c.values?.email).filter(Boolean),
                )
                // Keep stored credentials that don't conflict with initial ones
                const storedOnly = parsed.filter(
                  c => !c.values?.email || !initialEmails.has(c.values.email),
                )
                // For initial credentials, prefer stored version's extra fields but keep initial's core values
                const merged = initial.map(ic => {
                  const storedMatch = parsed.find(
                    sc => sc.values?.email && sc.values.email === ic.values?.email,
                  )
                  if (storedMatch) {
                    return { ...storedMatch, name: ic.name, values: { ...storedMatch.values, ...ic.values } }
                  }
                  return ic
                })
                const finalCreds = [...merged, ...storedOnly]

                setCredentials(prev => ({
                  ...prev,
                  [env.key]: finalCreds,
                }))

                // Persist the merged result so storage stays in sync
                storageAdapter
                  .setItem(STORAGE_KEY_PREFIX + env.key, JSON.stringify(finalCreds))
                  .catch(() => {})
              }
            } catch {
              // Invalid JSON — ignore
            }
          }
        }
      } finally {
        if (!cancelled) setLoadingCredentials(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [storageAdapter, environments, initialCredentials])

  // ── Persist credentials to storage ─────────────────────────
  const persistCredentials = useCallback(
    (envKey: string, creds: SavedCredential[]) => {
      if (!storageAdapter) return
      storageAdapter.setItem(STORAGE_KEY_PREFIX + envKey, JSON.stringify(creds)).catch(() => {})
    },
    [storageAdapter],
  )

  // ── Editor open/close ──────────────────────────────────────
  const openAddEditor = useCallback((envKey: string) => {
    setEditorEnvKey(envKey)
    setEditorIndex(null)
    setEditorName('')
    setEditorFields({})
    setEditorVisible(true)
  }, [])

  const openEditEditor = useCallback(
    (envKey: string, index: number) => {
      const cred = credentials[envKey]?.[index]
      if (!cred) return
      setEditorEnvKey(envKey)
      setEditorIndex(index)
      setEditorName(cred.name)
      setEditorFields({ ...cred.values })
      setEditorVisible(true)
    },
    [credentials],
  )

  const closeEditor = useCallback(() => {
    setEditorVisible(false)
    setEditorEnvKey('')
    setEditorIndex(null)
    setEditorName('')
    setEditorFields({})
  }, [])

  const saveEditor = useCallback(() => {
    const trimmedName = editorName.trim()
    if (!trimmedName) {
      Alert.alert('Error', 'Credential name cannot be empty')
      return
    }

    const newCred: SavedCredential = { name: trimmedName, values: { ...editorFields } }

    setCredentials(prev => {
      const envCreds = [...(prev[editorEnvKey] || [])]

      if (editorIndex !== null) {
        // Edit existing
        envCreds[editorIndex] = newCred
      } else {
        // Add new
        envCreds.push(newCred)
      }

      persistCredentials(editorEnvKey, envCreds)
      return { ...prev, [editorEnvKey]: envCreds }
    })

    closeEditor()
  }, [editorName, editorFields, editorEnvKey, editorIndex, persistCredentials, closeEditor])

  const updateEditorField = useCallback((fieldKey: string, value: string) => {
    setEditorFields(prev => ({ ...prev, [fieldKey]: value }))
  }, [])

  // ── Delete credential ──────────────────────────────────────
  const confirmDelete = useCallback(
    (envKey: string, index: number) => {
      const cred = credentials[envKey]?.[index]
      if (!cred) return

      Alert.alert('Delete Credential', `Remove "${cred.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCredentials(prev => {
              const envCreds = [...(prev[envKey] || [])]
              envCreds.splice(index, 1)
              persistCredentials(envKey, envCreds)
              return { ...prev, [envKey]: envCreds }
            })
          },
        },
      ])
    },
    [credentials, persistCredentials],
  )

  // ── Handle login ───────────────────────────────────────────
  const handleLogin = useCallback(
    async (envKey: string, index: number) => {
      if (!onLogin) return
      const cred = credentials[envKey]?.[index]
      if (!cred) return

      const loginKey = `${envKey}:${index}`
      setLoggingInKey(loginKey)
      try {
        await onLogin(envKey, cred.values)
      } finally {
        setLoggingInKey(null)
      }
    },
    [onLogin, credentials],
  )

  const activeEnv = environments.find(e => e.key === activeEnvironment)

  return (
    <View style={s.container}>
      <FlatList
        testID={TestIDs.environmentTab.container}
        data={environments}
        keyExtractor={env => env.key}
        contentContainerStyle={s.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: env }) => {
          const isActive = env.key === activeEnvironment
          const envColor = env.color || theme.accent
          const envCreds = credentials[env.key] || []

          return (
            <View
              testID={TestIDs.environmentTab.environmentCard(env.key)}
              style={[s.card, isActive && s.cardActive, isActive && { borderColor: envColor }]}
            >
              {/* ── Card Header ──────────────────── */}
              <TouchableOpacity
                testID={TestIDs.environmentTab.radioButton(env.key)}
                style={s.cardHeader}
                onPress={() => onEnvironmentChange(env.key)}
                activeOpacity={0.7}
              >
                <View style={s.radioRow}>
                  <View
                    style={[
                      s.radio,
                      isActive && s.radioActive,
                      isActive && { borderColor: envColor },
                    ]}
                  >
                    {isActive && <View style={[s.radioDot, { backgroundColor: envColor }]} />}
                  </View>
                  <View style={s.envInfo}>
                    <Text style={[s.envLabel, isActive && { color: envColor }]}>{env.label}</Text>
                    {env.baseUrl && (
                      <Text style={s.envUrl} numberOfLines={1}>
                        {env.baseUrl}
                      </Text>
                    )}
                  </View>
                </View>
                {isActive && (
                  <View style={[s.activeBadge, { backgroundColor: envColor + '20' }]}>
                    <Text style={[s.activeBadgeText, { color: envColor }]}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* ── Saved Credentials (active only) ── */}
              {isActive && credentialFields.length > 0 && (
                <View style={s.credentialsContainer}>
                  {loadingCredentials ? (
                    <View style={s.loadingContainer}>
                      <ActivityIndicator size="small" color={theme.textMuted} />
                      <Text style={s.loadingText}>Loading credentials…</Text>
                    </View>
                  ) : (
                    <>
                      {envCreds.length === 0 ? (
                        <View style={s.emptyState}>
                          <Text style={s.emptyText}>No saved credentials</Text>
                        </View>
                      ) : (
                        envCreds.map((cred, index) => (
                          <CredentialRow
                            key={`${cred.name}-${index}`}
                            envKey={env.key}
                            index={index}
                            credential={cred}
                            envColor={envColor}
                            onLogin={() => handleLogin(env.key, index)}
                            onEdit={() => openEditEditor(env.key, index)}
                            onDelete={() => confirmDelete(env.key, index)}
                            loggingIn={loggingInKey === `${env.key}:${index}`}
                            theme={theme}
                          />
                        ))
                      )}

                      {/* Add button */}
                      <TouchableOpacity
                        testID={TestIDs.environmentTab.addButton(env.key)}
                        style={[s.addButton, { borderColor: envColor }]}
                        onPress={() => openAddEditor(env.key)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.addButtonText, { color: envColor }]}>
                          ＋ Add Credential
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          )
        }}
        ListFooterComponent={
          <View testID={TestIDs.environmentTab.activeLabel} style={s.footer}>
            <Text style={s.footerText}>
              Active: {activeEnv?.label ?? activeEnvironment}
              {storageAdapter ? ' · Credentials saved' : ''}
            </Text>
          </View>
        }
      />

      {/* ── Editor Modal ──────────────────────────── */}
      <EditorModal
        visible={editorVisible}
        title={editorIndex !== null ? 'Edit Credential' : 'Add Credential'}
        credentialName={editorName}
        fieldValues={editorFields}
        credentialFields={credentialFields}
        onChangeName={setEditorName}
        onChangeField={updateEditorField}
        onSave={saveEditor}
        onCancel={closeEditor}
        theme={theme}
      />
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (t: BackstageTheme) =>
  StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { padding: 14, paddingBottom: 40 },

    // ── Card ────────────────────────
    card: {
      backgroundColor: t.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.border,
      marginBottom: 12,
      overflow: 'hidden',
    },
    cardActive: {
      backgroundColor: t.surfaceElevated,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
    },
    radioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    radioActive: {
      borderWidth: 2,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    envInfo: { flex: 1 },
    envLabel: {
      fontFamily: MonospaceFont,
      fontSize: 15,
      fontWeight: '700',
      color: t.text,
    },
    envUrl: {
      fontFamily: MonospaceFont,
      fontSize: 11,
      color: t.textMuted,
      marginTop: 3,
    },
    activeBadge: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginLeft: 8,
    },
    activeBadgeText: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // ── Credentials Section ─────────
    credentialsContainer: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
      paddingTop: 10,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    emptyText: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      color: t.textMuted,
      fontStyle: 'italic',
    },

    // ── Credential Row ──────────────
    credRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    credRowLeft: {
      flex: 1,
      marginRight: 8,
    },
    credName: {
      fontFamily: MonospaceFont,
      fontSize: 13,
      fontWeight: '700',
      color: t.text,
    },
    credMeta: {
      fontFamily: MonospaceFont,
      fontSize: 10,
      color: t.textMuted,
      marginTop: 2,
    },
    credRowActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    credActionButton: {
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      minWidth: 55,
      alignItems: 'center',
    },
    credActionLoginText: {
      fontFamily: MonospaceFont,
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    credActionIcon: {
      fontSize: 16,
      color: t.textMuted,
    },
    credDeleteIcon: {
      color: t.error,
    },

    // ── Add Button ──────────────────
    addButton: {
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'dashed',
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: 10,
    },
    addButtonText: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      fontWeight: '700',
    },

    // ── Footer ──────────────────────
    footer: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    footerText: {
      fontFamily: MonospaceFont,
      fontSize: 11,
      color: t.textMuted,
      fontStyle: 'italic',
    },

    // ── Loading ─────────────────────
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    loadingText: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      color: t.textMuted,
    },

    // ── Editor Modal ────────────────
    modalContainer: {
      flex: 1,
      backgroundColor: t.background,
      ...(Platform.OS === 'android' && { paddingTop: StatusBar.currentHeight }),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    modalTitle: {
      fontFamily: MonospaceFont,
      fontSize: 16,
      fontWeight: '700',
      color: t.text,
      flex: 1,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
    modalCancelText: {
      fontFamily: MonospaceFont,
      fontSize: 14,
      color: t.textSecondary,
      fontWeight: '600',
    },
    modalSaveText: {
      fontFamily: MonospaceFont,
      fontSize: 14,
      color: t.accent,
      fontWeight: '700',
    },
    modalBody: {
      flex: 1,
    },
    modalBodyContent: {
      padding: 16,
    },
    modalLabel: {
      fontFamily: MonospaceFont,
      fontSize: 12,
      fontWeight: '700',
      color: t.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    modalInput: {
      fontFamily: MonospaceFont,
      fontSize: 13,
      color: t.text,
      backgroundColor: t.surfaceElevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
  })
