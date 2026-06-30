/**
 * Ant Design Theme Token Configuration
 * Customizes Ant Design component appearance
 */

import { ThemeConfig } from "antd";
import { lightTheme } from "./theme";

export const getLightAntdTheme = (): ThemeConfig => ({
  token: {
    colorPrimary: lightTheme.colors.primary,
    colorSuccess: lightTheme.colors.success,
    colorWarning: lightTheme.colors.warning,
    colorError: lightTheme.colors.error,
    colorInfo: lightTheme.colors.info,
    colorBgBase: lightTheme.colors.backgroundAlt,
    colorTextBase: lightTheme.colors.textPrimary,
    borderRadius: 4,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif`,
    fontSize: 14,
    fontWeightStrong: 700,
    lineHeight: 1.5715,
    lineHeightHeading1: 1.2,
    lineHeightHeading2: 1.35,
    boxShadow:
      "0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08)",
    controlHeight: 32,
  },
  components: {
    Layout: {
      siderBg: lightTheme.colors.backgroundAlt,
      headerBg: lightTheme.colors.backgroundAlt,
      headerHeight: lightTheme.layout.headerHeight,
      headerPadding: "0 16px",
      headerColor: lightTheme.colors.textPrimary,
      triggerHeight: lightTheme.layout.headerHeight,
      triggerBg: lightTheme.colors.primary,
      triggerColor: "#fff",
      bodyBg: lightTheme.colors.background,
    },
    Menu: {
      colorPrimary: lightTheme.colors.primary,
      controlItemBgActive: lightTheme.colors.primaryLight,
      controlItemBgActiveHover: lightTheme.colors.primaryLight,
      controlItemBgHover: lightTheme.colors.borderLight,
    },
    Button: {
      colorPrimary: lightTheme.colors.primary,
      borderRadius: 4,
      controlHeight: 32,
    },
    Input: {
      borderRadius: 4,
      controlHeight: 32,
    },
    Card: {
      borderRadiusLG: 4,
      boxShadow: lightTheme.shadows.md,
    },
  },
});
