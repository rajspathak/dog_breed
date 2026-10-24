import { useMemo } from 'react';
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

const palette = {
  light: {
    background: '#F6F5F2',
    surface: '#FFFFFF',
    surfaceMuted: '#EFEDE8',
    border: '#E2DED6',
    text: '#1C1B19',
    textMuted: '#6B675F',
    textSubtle: '#8F8A80',
    accent: '#B4542D',
    accentMuted: '#F4E1D7',
    onAccent: '#FFFFFF',
    success: '#2F7D4F',
    warning: '#9A6400',
    warningSurface: '#FFF2D6',
    danger: '#B3261E',
    dangerSurface: '#FBE3E1',
    info: '#2C5F8A',
    infoSurface: '#E2EEF8',
    scaleEmpty: '#E5E1D9',
    overlay: 'rgba(0, 0, 0, 0.92)',
  },
  dark: {
    background: '#121110',
    surface: '#1D1C1A',
    surfaceMuted: '#2A2826',
    border: '#34312D',
    text: '#F2F0EC',
    textMuted: '#AAA49A',
    textSubtle: '#7F7A71',
    accent: '#E58A62',
    accentMuted: '#45291D',
    onAccent: '#1A0E08',
    success: '#6CC18D',
    warning: '#E8B354',
    warningSurface: '#3A2C10',
    danger: '#F2867D',
    dangerSurface: '#3D1A17',
    info: '#8DBCE6',
    infoSurface: '#16293A',
    scaleEmpty: '#3A3733',
    overlay: 'rgba(0, 0, 0, 0.96)',
  },
} as const;

export type ColorTokens = { [K in keyof (typeof palette)['light']]: string };

export type Theme = {
  dark: boolean;
  colors: ColorTokens;
  spacing: (units: number) => number;
  radius: { sm: number; md: number; lg: number; pill: number };
  font: { caption: number; body: number; title: number; heading: number; display: number };
};

const build = (dark: boolean): Theme => ({
  dark,
  colors: dark ? palette.dark : palette.light,
  spacing: (units) => units * 4,
  radius: { sm: 6, md: 10, lg: 16, pill: 999 },
  font: { caption: 12, body: 15, title: 17, heading: 20, display: 28 },
});

const themes = { light: build(false), dark: build(true) };

export const useTheme = (): Theme => (useColorScheme() === 'dark' ? themes.dark : themes.light);

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export const createThemedStyles = <T extends NamedStyles<T>>(factory: (theme: Theme) => T & NamedStyles<T>) => {
  const cache = new Map<boolean, Readonly<T>>();
  return (): Readonly<T> => {
    const theme = useTheme();
    return useMemo(() => {
      const cached = cache.get(theme.dark);
      if (cached) return cached;
      const styles = StyleSheet.create(factory(theme));
      cache.set(theme.dark, styles);
      return styles;
    }, [theme]);
  };
};
