/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from "react";

export interface ISidebarChildItem {
  key: string;
  path: string;
  icon: string;
  label: ReactNode;
}

export interface ISidebarItem {
  key: string;
  path: string;
  icon: string;
  label: ReactNode;
  children?: ISidebarChildItem[];
}

export interface IDynamicSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  isMobile?: boolean;
  sidebarVisible?: boolean;
  onSidebarClose?: () => void;
}
export interface IPaginationData {
  pageIndex: number;
  pageSize: number;
  totalResult: number;
  totalPages: number;
}

export interface IMenuItems {
  key: string;
  icon: string;
  label: string;
  path: string;
}

export interface IAppRoute {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  protected?: boolean;
  isEdit?: boolean;
}

export interface IMenuItemWithClick {
  key: string;
  path?: string;
  icon: string;
  label: ReactNode;
  onClick: () => void;
}

export interface IFieldConfig {
  name: string;
  title: string;
  requiredMessage?: string;
  type?: "text" | "number" | "checkbox" | "hidden" | "textarea" | "select";
  initialValue?: any;
  rules?: any[];
  checkboxLabel?: string;
  options?: { value: string; label: string }[];
}

/**
 * Iframe Security Utilities
 * Common functions for iframe and referrer validation
 */
export interface IAccessCheckResult {
  allowed: boolean;
  referrerInfo: string;
}

export interface IProtectedRouteProps {
  children: React.ReactNode;
  allowedParentUrls?: string[];
  fallbackUrl?: string;
}
