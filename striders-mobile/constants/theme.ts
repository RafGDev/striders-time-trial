/**
 * Striders Time Trial - Theme Constants
 *
 * Centralized color palette and theme configuration.
 * Import these values instead of hardcoding colors throughout the app.
 */

// ============================================================================
// Brand Colors
// ============================================================================

/** Striders primary brand color - teal */
export const STRIDERS_TEAL = "#00A290";

/** Strava brand orange - used for Strava-related actions */
export const STRAVA_ORANGE = "#FC4C02";

// ============================================================================
// Dark Mode Colors
// ============================================================================

export const DarkModeColors = {
  /** Main background color for screens */
  background: "#121212",
  /** Elevated surface color (cards, lists) */
  surface: "#1e1e1e",
  /** Primary text color */
  text: "#ffffff",
  /** Secondary/muted text color */
  textSecondary: "#888888",
} as const;

// ============================================================================
// Light Mode Colors
// ============================================================================

export const LightModeColors = {
  /** Main background color for screens */
  background: "#f5f5f5",
  /** Elevated surface color (cards, lists) */
  surface: "#ffffff",
  /** Primary text color */
  text: "#000000",
  /** Secondary/muted text color */
  textSecondary: "#666666",
} as const;

// ============================================================================
// Theme Helpers
// ============================================================================

/**
 * Get theme colors based on color scheme
 */
export function getThemeColors(isDark: boolean) {
  return {
    background: isDark ? DarkModeColors.background : LightModeColors.background,
    surface: isDark ? DarkModeColors.surface : LightModeColors.surface,
    text: isDark ? DarkModeColors.text : LightModeColors.text,
    textSecondary: isDark
      ? DarkModeColors.textSecondary
      : LightModeColors.textSecondary,
    borderColor: isDark ? "#333333" : "#cccccc",
    inputBackground: isDark ? DarkModeColors.surface : LightModeColors.surface,
    primary: STRIDERS_TEAL,
    accent: STRAVA_ORANGE,
  };
}

// ============================================================================
// Navigation Theme (for React Navigation)
// ============================================================================

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: STRIDERS_TEAL,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: STRIDERS_TEAL,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: STRIDERS_TEAL,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: STRIDERS_TEAL,
  },
} as const;
