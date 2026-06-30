/**
 * Custom Hooks
 * useTheme - Manage theme state and switching
 */

import { useState, useCallback, useEffect } from "react";
import { STORAGE_KEYS, THEME_TYPES } from "../constants";

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    return (savedTheme as "light" | "dark") || THEME_TYPES.LIGHT;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    // Update document theme
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) =>
      prev === THEME_TYPES.LIGHT ? THEME_TYPES.DARK : THEME_TYPES.LIGHT,
    );
  }, []);

  return { theme, toggleTheme };
};

/**
 * useResponsive - Detect responsive breakpoints
 */
export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768 && window.innerWidth < 1200;
  });

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1200;
  });

  useEffect(() => {
    const handleResize = () => {
      try {
        const width = window.innerWidth;
        setIsMobile(width < 768);
        setIsTablet(width >= 768 && width < 1200);
        setIsDesktop(width >= 1200);
      } catch {
        // Blocked in cross-origin iframe context
      }
    };

    try {
      window.addEventListener("resize", handleResize);
    } catch {
      // Blocked in cross-origin iframe context
    }

    return () => {
      try {
        window.removeEventListener("resize", handleResize);
      } catch {
        // Blocked in cross-origin iframe context
      }
    };
  }, []);

  return { isMobile, isTablet, isDesktop };
};

/**
 * useSidebar - Manage sidebar collapse state
 */
export const useSidebar = () => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem(
        STORAGE_KEYS.SIDEBAR_COLLAPSED,
        JSON.stringify(newState),
      );
      return newState;
    });
  }, []);

  return { collapsed, toggleSidebar };
};
