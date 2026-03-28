# rn-backstage

A zero-dependency developer/QA debug panel for React Native apps. Inspect device info, view state trees, monitor console logs, inspect network requests, and trigger custom actions — all from a sleek in-app panel.

## Features

- 🎯 **Draggable floating pill** — always accessible, repositionable trigger
- 📱 **Device & build info** — OS version, app version, build number, and custom data
- 🌳 **State tree inspector** — visualize Redux, Zustand, or any store state
- 📋 **Console log viewer** — intercepts all console methods with search & filtering
- 🌐 **Network inspector** — intercepts fetch & XMLHttpRequest with request/response details, headers, body, timing, and copy-as-cURL
- ⚡ **Quick actions** — add custom buttons (logout, clear cache, etc.)
- 🔌 **Extensible tabs** — add custom tabs for app-specific debugging tools
- 🎨 **Dark glassmorphism UI** — beautiful, professional developer tool aesthetic
- 📦 **Zero dependencies** — only peer deps are `react` and `react-native`

## Installation

```sh
npm install rn-backstage
# or
yarn add rn-backstage
```

No additional native dependencies required!

## Usage

```tsx
import { Backstage } from 'rn-backstage'

export default function App() {
  return (
    <>
      {/* Your app content */}
      <Backstage
        appVersion="1.2.3"
        buildNumber="42"
        bundleId="com.example.app"
        state={store.getState()}
        quickActions={[
          { title: 'Logout', onPress: handleLogout, destructive: true },
          { title: 'Clear Cache', onPress: clearCache },
        ]}
        onCopyLogs={logs => Clipboard.setString(logs)}
      />
    </>
  )
}
```

## Network Inspector

The Network tab automatically intercepts all `fetch()` and `XMLHttpRequest` traffic — including libraries built on top of them like **Axios**, **Apisauce**, **ky**, and **Apollo Client**.

Each request shows:
- Method, URL, status code, and duration
- Request & response headers
- Request & response body (auto-parsed JSON with tree view)
- Response size
- Copy as cURL (long-press any request)

```tsx
<Backstage
  // Network inspector is enabled by default
  enableNetworkInspector={true}
  // Exclude noisy URLs (analytics, Sentry, etc.)
  networkFilters={['sentry.io', 'analytics', 'hot-update']}
  // Limit body capture size (default: 64KB)
  maxNetworkBodySize={65536}
  // Auto-filters console.logs from Axios interceptors / fetch .then() chains
  // out of the Logs tab (they're already in the Network tab). Default: true
  autoFilterNetworkLogs={true}
/>
```

## Props

| Prop                     | Type                     | Default     | Description                                     |
| ------------------------ | ------------------------ | ----------- | ----------------------------------------------- |
| `visible`                | `boolean`                | `true`      | Show/hide the floating pill                     |
| `appVersion`             | `string`                 | `undefined` | App version to display                          |
| `buildNumber`            | `string`                 | `undefined` | Build number                                    |
| `bundleId`               | `string`                 | `undefined` | Bundle identifier                               |
| `deviceInfo`             | `AppInfoItem[]`          | `[]`        | Additional device/app info rows                 |
| `state`                  | `object`                 | `undefined` | State tree to inspect                           |
| `quickActions`           | `QuickAction[]`          | `[]`        | Custom action buttons                           |
| `maxLogs`                | `number`                 | `500`       | Maximum logs to retain                          |
| `logFilters`             | `string[]`               | `[]`        | Messages to exclude from logs                   |
| `onCopyLogs`             | `(logs: string) => void` | `undefined` | Callback when copying logs                      |
| `enableNetworkInspector` | `boolean`                | `true`      | Enable/disable network request interception     |
| `maxNetworkEntries`      | `number`                 | `500`       | Maximum network entries to retain               |
| `maxNetworkBodySize`     | `number`                 | `65536`     | Max body size (bytes) to capture per request    |
| `networkFilters`         | `string[]`               | `[]`        | URL substrings to exclude from capture          |
| `autoFilterNetworkLogs`  | `boolean`                | `true`      | Auto-filter network callback logs from Logs tab |
| `extraTabs`              | `BackstageTab[]`         | `[]`        | Additional custom tabs                          |
| `children`               | `ReactNode`              | `undefined` | Extra content in InfoTab                        |

## Ref Methods

```tsx
const ref = useRef<BackstageRef>(null)

ref.current?.open() // Open the panel
ref.current?.close() // Close the panel
ref.current?.clearLogs() // Clear all captured logs
```

## License

MIT
