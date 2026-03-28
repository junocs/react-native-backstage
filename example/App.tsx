import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Backstage } from 'react-native-backstage'
import type { BackstageRef, BackstageTab } from 'react-native-backstage'

// ─── Mock Data: Simulates a real app store ────────────────────────────────────

const mockStore = {
  user: {
    id: 'usr_9842',
    name: 'Jane Developer',
    email: 'jane@example.com',
    avatar: 'https://i.pravatar.cc/100',
    role: 'admin',
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en-US',
      beta: true,
    },
  },
  auth: {
    isAuthenticated: true,
    token: 'eyJhbGc...truncated',
    refreshToken: 'rft_abc123',
    expiresAt: '2026-04-01T00:00:00Z',
  },
  cart: {
    items: [
      { id: 'prod_1', name: 'Wireless Headphones', price: 79.99, qty: 1 },
      { id: 'prod_2', name: 'USB-C Hub', price: 34.99, qty: 2 },
      { id: 'prod_3', name: 'Mechanical Keyboard', price: 149.99, qty: 1 },
    ],
    subtotal: 299.96,
    currency: 'USD',
  },
  features: {
    darkMode: true,
    biometricLogin: true,
    pushNotifications: false,
    inAppPurchases: true,
  },
}

// ─── Custom Tab Example ──────────────────────────────────────────────────────

const EnvironmentTab: React.FC = () => (
  <ScrollView style={envStyles.container} contentContainerStyle={envStyles.content}>
    <Text style={envStyles.sectionTitle}>ENVIRONMENT VARIABLES</Text>
    <View style={envStyles.card}>
      {[
        { key: 'NODE_ENV', value: 'development' },
        { key: 'API_URL', value: 'https://api.staging.example.com' },
        { key: 'WS_URL', value: 'wss://ws.staging.example.com' },
        { key: 'SENTRY_DSN', value: 'https://abc@sentry.io/123' },
        { key: 'FEATURE_FLAGS_URL', value: 'https://flags.example.com/v1' },
        { key: 'ANALYTICS_KEY', value: 'UA-12345-6' },
      ].map(({ key, value }, i, arr) => (
        <View key={key}>
          <View style={envStyles.row}>
            <Text style={envStyles.key}>{key}</Text>
            <Text style={envStyles.value} numberOfLines={1} selectable>
              {value}
            </Text>
          </View>
          {i < arr.length - 1 && <View style={envStyles.divider} />}
        </View>
      ))}
    </View>

    <Text style={envStyles.sectionTitle}>BUILD CONFIGURATION</Text>
    <View style={envStyles.card}>
      {[
        { key: 'Build Type', value: __DEV__ ? 'Debug' : 'Release' },
        { key: 'Hermes', value: typeof HermesInternal !== 'undefined' ? 'Enabled' : 'Disabled' },
        { key: 'New Architecture', value: 'Enabled' },
        { key: 'Platform', value: Platform.OS },
      ].map(({ key, value }, i, arr) => (
        <View key={key}>
          <View style={envStyles.row}>
            <Text style={envStyles.key}>{key}</Text>
            <Text style={envStyles.value}>{value}</Text>
          </View>
          {i < arr.length - 1 && <View style={envStyles.divider} />}
        </View>
      ))}
    </View>
  </ScrollView>
)

const envStyles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#606075',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 16,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#1E1E2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A3A',
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  key: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#A0A0B0',
    flex: 1,
  },
  value: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#E8E8ED',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A3A',
    marginHorizontal: 4,
  },
})

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const backstageRef = useRef<BackstageRef>(null)
  const [logCount, setLogCount] = useState(0)

  // Fire off some example console logs on mount
  useEffect(() => {
    console.log('🚀 App launched successfully')
    console.info('ℹ️ Running on', Platform.OS, 'version', Platform.Version)
    console.debug('🐛 Debug mode is enabled')

    console.log('📦 Store initialized', {
      userCount: 1,
      cartItems: mockStore.cart.items.length,
      features: Object.keys(mockStore.features).length,
    })

    // Simulate async operations
    const timer1 = setTimeout(() => {
      console.log('🌐 API connection established')
      console.log('📡 WebSocket connected to wss://ws.staging.example.com')
    }, 1500)

    const timer2 = setTimeout(() => {
      console.warn('⚠️ Cache is stale — last updated 2 hours ago')
    }, 3000)

    const timer3 = setTimeout(() => {
      console.error(new Error('Failed to load user preferences: Network timeout'))
    }, 5000)

    const timer4 = setTimeout(() => {
      console.info('🔄 Background sync completed — 12 items synced')
      console.log('✅ All services healthy')
    }, 7000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [])

  // Quick action handlers
  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'You have been logged out (mock)')
    console.log('👤 User logged out')
  }, [])

  const handleClearCache = useCallback(() => {
    Alert.alert('Cache Cleared', 'All cached data has been purged (mock)')
    console.log('🗑️ Cache cleared')
  }, [])

  const handleResetOnboarding = useCallback(() => {
    Alert.alert('Onboarding Reset', 'Onboarding flow will show on next launch (mock)')
    console.info('🔄 Onboarding state reset')
  }, [])

  const handleCrashTest = useCallback(() => {
    console.error(new Error('🔥 Manual crash test triggered'))
    console.error('Stack trace simulation: at App.tsx:42, at Screen.tsx:18')
  }, [])

  const handleCopyLogs = useCallback((logs: string) => {
    // In a real app: Clipboard.setString(logs)
    Alert.alert('Copied!', `${logs.split('\n').length} entries copied to clipboard`)
    console.log(`📋 Copied ${logs.split('\n').length} entries to clipboard`)
  }, [])

  // Simulate periodic logs
  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        () => console.log('⏱️ Heartbeat — app is alive'),
        () => console.debug(`📊 Memory usage: ${Math.floor(Math.random() * 200) + 50}MB`),
        () => console.log('🔄 Checking for updates...'),
        () => console.info(`📬 Push notification token refreshed`),
        () => {
          if (Math.random() > 0.7) {
            console.warn('⚠️ Slow network response detected (>2s)')
          }
        },
      ]
      const fn = messages[Math.floor(Math.random() * messages.length)]
      if (fn) fn()
      setLogCount(p => p + 1)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Custom extra tab
  const extraTabs: BackstageTab[] = [
    {
      key: 'env',
      title: 'Env',
      icon: '🔧',
      render: () => <EnvironmentTab />,
    },
  ]

  // Demo action buttons for the main app UI
  const triggerLog = useCallback((type: string) => {
    switch (type) {
      case 'log':
        console.log('📝 Manual log entry', { timestamp: new Date().toISOString() })
        break
      case 'warn':
        console.warn('⚠️ Manual warning triggered')
        break
      case 'error':
        console.error(new Error('❌ Manual error thrown'))
        break
      case 'object':
        console.log('📦 Complex object:', {
          users: [
            { id: 1, name: 'Alice', roles: ['admin', 'editor'] },
            { id: 2, name: 'Bob', roles: ['viewer'] },
          ],
          metadata: {
            total: 2,
            page: 1,
            nested: { deep: { value: true } },
          },
        })
        break
    }
  }, [])

  // Network demo functions
  const triggerNetwork = useCallback((type: string) => {
    switch (type) {
      case 'get':
        fetch('https://jsonplaceholder.typicode.com/posts/1')
          .then(res => res.json())
          .then(data => console.log('✅ GET response:', data.title))
          .catch(err => console.error('GET failed:', err))
        break
      case 'post':
        fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token-12345',
          },
          body: JSON.stringify({
            title: 'New Post from Backstage',
            body: 'Testing the network inspector!',
            userId: 1,
          }),
        })
          .then(res => res.json())
          .then(data => console.log('✅ POST response:', data))
          .catch(err => console.error('POST failed:', err))
        break
      case 'error':
        fetch('https://jsonplaceholder.typicode.com/posts/99999')
          .then(res => {
            if (!res.ok) console.warn(`⚠️ Request returned ${res.status}`)
            return res.json()
          })
          .catch(err => console.error('Request failed:', err))
        break
      case 'multi':
        // Fire multiple concurrent requests
        Promise.all([
          fetch('https://jsonplaceholder.typicode.com/users/1'),
          fetch('https://jsonplaceholder.typicode.com/todos/1'),
          fetch('https://jsonplaceholder.typicode.com/comments?postId=1'),
        ])
          .then(() => console.log('✅ All 3 concurrent requests completed'))
          .catch(err => console.error('Multi-fetch failed:', err))
        break
    }
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── App Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🎭</Text>
        <Text style={styles.title}>Backstage</Text>
        <Text style={styles.subtitle}>Developer Debug Panel</Text>
      </View>

      {/* ── Main Content ──────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 How to Use</Text>
          <Text style={styles.cardText}>
            Tap the floating <Text style={styles.highlight}>purple pill</Text> in the bottom-right
            corner to open the Backstage panel. You can drag it to reposition.
          </Text>
          <Text style={styles.cardText}>
            The pill turns <Text style={styles.errorText}>red</Text> when a{' '}
            <Text style={styles.code}>console.error</Text> is captured.
          </Text>
        </View>

        {/* Log Triggers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔬 Trigger Console Logs</Text>
          <Text style={styles.cardDescription}>
            Tap buttons to fire console methods. View them in the Logs tab.
          </Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.button, styles.buttonLog]}
              onPress={() => triggerLog('log')}
            >
              <Text style={styles.buttonText}>console.log</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonWarn]}
              onPress={() => triggerLog('warn')}
            >
              <Text style={styles.buttonText}>console.warn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonError]}
              onPress={() => triggerLog('error')}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>console.error</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonObject]}
              onPress={() => triggerLog('object')}
            >
              <Text style={styles.buttonText}>Log Object</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Network Triggers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌐 Trigger Network Requests</Text>
          <Text style={styles.cardDescription}>
            Tap buttons to fire real HTTP requests. View them in the Network tab.
          </Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.button, styles.buttonGet]}
              onPress={() => triggerNetwork('get')}
            >
              <Text style={styles.buttonText}>GET</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPost]}
              onPress={() => triggerNetwork('post')}
            >
              <Text style={styles.buttonText}>POST</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonError]}
              onPress={() => triggerNetwork('error')}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>404 Error</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonMulti]}
              onPress={() => triggerNetwork('multi')}
            >
              <Text style={styles.buttonText}>3x Parallel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Showcase */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✨ Features Showcase</Text>
          <View style={styles.featureList}>
            {[
              { icon: '🎯', text: 'Draggable floating pill trigger' },
              { icon: '📱', text: 'Device & build info (Info tab)' },
              { icon: '🌐', text: 'Network inspector with cURL copy' },
              { icon: '🌳', text: 'State tree inspector (mock Redux store)' },
              { icon: '📋', text: 'Console log viewer with search' },
              { icon: '⚡', text: 'Quick actions (Logout, Clear cache, etc.)' },
              { icon: '🔌', text: 'Custom "Env" tab via extraTabs prop' },
              { icon: '📦', text: 'Zero runtime dependencies' },
            ].map(({ icon, text }, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{icon}</Text>
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{logCount}</Text>
            <Text style={styles.statLabel}>Periodic Logs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Dependencies</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Tabs</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>react-native-backstage v1.0.0</Text>
        </View>
      </ScrollView>

      {/* ── Backstage Debug Panel ─────────────────────────────── */}
      <Backstage
        ref={backstageRef}
        appVersion="1.0.0"
        buildNumber="42"
        bundleId="com.backstage.example"
        deviceInfo={[
          { label: 'Device Name', value: 'iPhone 16 Pro' },
          { label: 'Environment', value: 'Staging' },
          { label: 'Build Config', value: __DEV__ ? 'Debug' : 'Release' },
        ]}
        state={mockStore}
        quickActions={[
          {
            title: 'Logout',
            onPress: handleLogout,
            icon: '🚪',
            destructive: true,
            closeOnPress: true,
          },
          {
            title: 'Clear Cache',
            onPress: handleClearCache,
            icon: '🗑️',
          },
          {
            title: 'Reset Onboarding',
            onPress: handleResetOnboarding,
            icon: '🔄',
          },
          {
            title: 'Crash Test',
            onPress: handleCrashTest,
            icon: '💥',
            destructive: true,
          },
        ]}
        onCopyLogs={handleCopyLogs}
        extraTabs={extraTabs}
        maxLogs={500}
        networkFilters={['symbolicate']} // exclude RN internal symbolicate requests
      />
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8ED',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8888A0',
    marginTop: 4,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8888A0',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardText: {
    fontSize: 14,
    color: '#555570',
    lineHeight: 22,
    marginBottom: 6,
  },
  highlight: {
    color: '#7C5CFC',
    fontWeight: '700',
  },
  errorText: {
    color: '#FF4D6A',
    fontWeight: '700',
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    backgroundColor: '#F0F0F5',
    color: '#7C5CFC',
    paddingHorizontal: 4,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  buttonLog: {
    backgroundColor: '#F0F0F5',
    borderColor: '#D0D0DA',
  },
  buttonWarn: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD54F',
  },
  buttonError: {
    backgroundColor: '#FF4D6A',
    borderColor: '#FF4D6A',
  },
  buttonObject: {
    backgroundColor: '#E8F0FE',
    borderColor: '#90CAF9',
  },
  buttonGet: {
    backgroundColor: '#E8F5E9',
    borderColor: '#66BB6A',
  },
  buttonPost: {
    backgroundColor: '#E3F2FD',
    borderColor: '#42A5F5',
  },
  buttonMulti: {
    backgroundColor: '#F3E5F5',
    borderColor: '#AB47BC',
  },
  buttonText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '600',
    color: '#333345',
  },
  featureList: {
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#555570',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#7C5CFC',
  },
  statLabel: {
    fontSize: 11,
    color: '#8888A0',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#B0B0C0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
})
