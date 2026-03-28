export type ThemeId = 'resonance' | 'nightfall' | 'twilight' | 'prism';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  emoji: string;
  accent: string;
}

export const THEMES: ReadonlyArray<ThemeDefinition>;
export const THEME_STORAGE_KEY: string;
export function isThemeId(value: unknown): value is ThemeId;
export function loadTheme(): ThemeId;
export function saveTheme(themeId: ThemeId): void;
