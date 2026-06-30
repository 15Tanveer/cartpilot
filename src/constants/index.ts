/**
 * Application Constants
 * Centralized constant definitions for routes, menu items, and other static values
 */

// Local Development Entry Points
export const LOCAL_ENTRY_POINTS = [
  "http://localhost:3000",
  "http://localhost:3001",
];

export enum ROUTES {
  HOME = "/",
  LOGIN = "/login",
  NOT_FOUND = "*",

  //carts
  CARTS = "/carts",
  EDIT_CART = "/carts/edit/:id",
}

export const MENU_ITEMS = [
  {
    key: ROUTES.CARTS,
    icon: "ShoppingCartOutlined",
    label: "Abandoned Carts",
    path: ROUTES.CARTS,
  },
];

export const APP_NAME = "Cartpilot";
export const APP_VERSION = "1.0.0";

export const STORAGE_KEYS = {
  THEME: "app_theme",
  SIDEBAR_COLLAPSED: "sidebar_collapsed",
  USER_PREFERENCES: "user_preferences",
} as const;

export const THEME_TYPES = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export const HTTP_TIMEOUT = 10000; // 10 seconds
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export const BREAKPOINTS = {
  XS: 480,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1600,
} as const;

// Field names to exclude from API payloads
export const EXCLUDED_FIELD_NAMES = {
  TABLE_KEY: "TableKey",
  LAST_PUBLISHED_DATE: "LastPublishedDate",
};

export const DEFAULT_DISPLAY_ORDER = "999";
