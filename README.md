# rn-backstage

A zero-dependency developer/QA debug panel for React Native apps. Inspect device info, view state trees, monitor console logs, and trigger custom actions — all from a sleek in-app panel.

## Features

- 🎯 **Draggable floating pill** — always accessible, repositionable trigger
- 📱 **Device & build info** — OS version, app version, build number, and custom data
- 🌳 **State tree inspector** — visualize Redux, Zustand, or any store state
- 📋 **Console log viewer** — intercepts all console methods with search & filtering
- ⚡ **Quick actions** — add custom buttons (logout, clear cache, etc.)
- 🔌 **Extensible tabs** — add custom tabs for features like network inspection
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

## Props

| Prop           | Type                     | Default     | Description                     |
| -------------- | ------------------------ | ----------- | ------------------------------- |
| `visible`      | `boolean`                | `true`      | Show/hide the floating pill     |
| `appVersion`   | `string`                 | `undefined` | App version to display          |
| `buildNumber`  | `string`                 | `undefined` | Build number                    |
| `bundleId`     | `string`                 | `undefined` | Bundle identifier               |
| `deviceInfo`   | `AppInfoItem[]`          | `[]`        | Additional device/app info rows |
| `state`        | `object`                 | `undefined` | State tree to inspect           |
| `quickActions` | `QuickAction[]`          | `[]`        | Custom action buttons           |
| `maxLogs`      | `number`                 | `500`       | Maximum logs to retain          |
| `logFilters`   | `string[]`               | `[]`        | Messages to exclude from logs   |
| `onCopyLogs`   | `(logs: string) => void` | `undefined` | Callback when copying logs      |
| `extraTabs`    | `BackstageTab[]`         | `[]`        | Additional custom tabs          |
| `children`     | `ReactNode`              | `undefined` | Extra content in InfoTab        |

## Ref Methods

```tsx
const ref = useRef<BackstageRef>(null)

ref.current?.open() // Open the panel
ref.current?.close() // Close the panel
ref.current?.clearLogs() // Clear all captured logs
```

## License

MIT
