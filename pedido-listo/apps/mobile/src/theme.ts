import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'normal' | 'dark';

export const darkColors = {
  bg: '#09090b',
  bgElevated: '#111116',
  surface: '#15151b',
  surfaceElevated: '#1d1d26',
  surfaceSoft: '#242430',
  text: '#fafafa',
  textSoft: '#dedee8',
  muted: '#9696a6',
  accent: '#a855f7',
  accentDark: '#d8b4fe',
  accentSoft: '#2a183d',
  accentGlow: '#ec4899',
  orange: '#fb923c',
  border: '#2c2c38',
  borderStrong: '#444455',
  success: '#34d399',
  successSoft: '#12382f',
  preparing: '#60a5fa',
  warning: '#fbbf24',
  danger: '#fb7185',
  dangerSoft: '#3b1721',
  onAccent: '#ffffff',
  scrim: 'rgba(0,0,0,0.78)',
  tabBar: 'rgba(17,17,22,0.98)',
  input: '#111116',
};

export const normalColors: typeof darkColors = {
  bg: '#fffaf5',
  bgElevated: '#fff7ed',
  surface: '#ffffff',
  surfaceElevated: '#fff7ed',
  surfaceSoft: '#ffedd5',
  text: '#1c1917',
  textSoft: '#44403c',
  muted: '#78716c',
  accent: '#c2410c',
  accentDark: '#9a3412',
  accentSoft: '#ffedd5',
  accentGlow: '#ea580c',
  orange: '#f97316',
  border: '#e7e5e4',
  borderStrong: '#d6d3d1',
  success: '#15803d',
  successSoft: '#dcfce7',
  preparing: '#2563eb',
  warning: '#ca8a04',
  danger: '#b91c1c',
  dangerSoft: '#fee2e2',
  onAccent: '#ffffff',
  scrim: 'rgba(28,25,23,0.55)',
  tabBar: 'rgba(255,255,255,0.98)',
  input: '#ffffff',
};

export type ThemeColors = typeof darkColors;

export const darkGradients = {
  hero: ['#7c3aed', '#db2777', '#f97316'] as const,
  primary: ['#9333ea', '#db2777'] as const,
  subtle: ['#21122f', '#19131f', '#15151b'] as const,
  glow: ['rgba(168,85,247,0.28)', 'rgba(236,72,153,0.08)', 'rgba(9,9,11,0)'] as const,
};

export type ThemeGradients = {
  hero: readonly [string, string, string];
  primary: readonly [string, string];
  subtle: readonly [string, string, string];
  glow: readonly [string, string, string];
};

export const normalGradients: ThemeGradients = {
  hero: ['#c2410c', '#ea580c', '#fb923c'] as const,
  primary: ['#c2410c', '#f97316'] as const,
  subtle: ['#fff7ed', '#fffbf7', '#ffffff'] as const,
  glow: ['rgba(234,88,12,0.20)', 'rgba(251,146,60,0.08)', 'rgba(255,250,245,0)'] as const,
};

const THEME_STORAGE_KEY = '@pedidolisto/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  gradients: ThemeGradients;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: darkColors,
  gradients: darkGradients,
  setMode: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    void AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'normal' || saved === 'dark') setModeState(saved);
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next)
      .then(() => setModeState(next))
      .catch(() => setModeState(next));
  };

  const value = useMemo(
    () => ({
      mode,
      colors: mode === 'dark' ? darkColors : normalColors,
      gradients: mode === 'dark' ? darkGradients : normalGradients,
      setMode,
    }),
    [mode]
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};
