import React, { createContext, useContext, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { DarkTheme, LightTheme } from './constants'
import type { BackstageTheme } from './types'

// ─── Theme Preference ────────────────────────────────────────────────────────

export type ThemePreference = 'light' | 'dark' | 'auto'

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<BackstageTheme>(DarkTheme)

// ─── Provider ────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  preference: ThemePreference
  children: React.ReactNode
}

export const BackstageThemeProvider: React.FC<ThemeProviderProps> = ({ preference, children }) => {
  const systemScheme = useColorScheme()

  const theme = useMemo(() => {
    if (preference === 'light') return LightTheme
    if (preference === 'dark') return DarkTheme
    // 'auto' — follow system, fallback to dark
    return systemScheme === 'light' ? LightTheme : DarkTheme
  }, [preference, systemScheme])

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBackstageTheme(): BackstageTheme {
  return useContext(ThemeContext)
}
