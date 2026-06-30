/**
 * Theme Configuration File
 * Centralized theme management for the entire application
 * Colors, typography, and other design tokens can be managed here
 */

export const lightTheme = {
  colors: {
    // Primary Colors (Green Theme)
    primary: "#5db043",
    primaryLight: "#e0ffd1",
    primaryDark: "#4a8a35",

    // Secondary Colors (Dark Green)
    secondary: "#36882f",
    secondaryLight: "#4da83f",
    secondaryDark: "#2a6620",

    // Neutral Colors
    textPrimary: "#262626",
    textSecondary: "#666666",
    textDisabled: "#999999",
    background: "#f5f5f5",
    backgroundAlt: "#ffffff",
    border: "#d9d9d9",
    borderLight: "#f0f0f0",

    // Status Colors
    success: "#52c41a",
    successLight: "#f6ffed",
    successDark: "#274a17",

    warning: "#faad14",
    warningLight: "#fffbe6",
    warningDark: "#ad6800",

    error: "#ff4d4f",
    errorLight: "#fff1f0",
    errorDark: "#820014",

    info: "#1890ff",
    infoLight: "#e6f7ff",
    infoDark: "#003a8c",
  },
  typography: {
    h1: {
      fontSize: "32px",
      fontWeight: 700,
      lineHeight: "1.35",
    },
    h2: {
      fontSize: "28px",
      fontWeight: 700,
      lineHeight: "1.35",
    },
    h3: {
      fontSize: "24px",
      fontWeight: 600,
      lineHeight: "1.35",
    },
    h4: {
      fontSize: "20px",
      fontWeight: 600,
      lineHeight: "1.35",
    },
    body1: {
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: "1.5715",
    },
    body2: {
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: "1.5715",
    },
    caption: {
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: "1.5",
      color: "#00000073",
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  borderRadius: {
    none: "0px",
    sm: "2px",
    md: "4px",
    lg: "8px",
    xl: "16px",
    round: "50%",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)",
    md: "0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08)",
    lg: "0 9px 28px 8px rgba(0, 0, 0, 0.05), 0 6px 16px 0 rgba(0, 0, 0, 0.08)",
  },
  layout: {
    sidebarWidth: 200,
    sidebarWidthCollapsed: 80,
    headerHeight: 64,
    headerHeightMobile: 56,
  },
  breakpoints: {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
  },
};

export type Theme = typeof lightTheme;
