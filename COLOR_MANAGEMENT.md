# Color Management System - Single Source of Truth

## Overview

This application uses a **centralized color management system** where all colors are defined in ONE place and automatically propagated throughout the entire application.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  PRIMARY SOURCE: src/config/theme.ts                │
│  (lightTheme.colors object)                         │
└────────────────┬────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
src/config/antdTheme.ts    src/styles/variables.scss
(Ant Design Components)    (SCSS Components)
    │                         │
    ├─────────────────────────┤
    │                         │
    ▼                         ▼
React Components        .scss Style Files
```

## Files Involved

### 1. **src/config/theme.ts** (PRIMARY SOURCE)

The main configuration file where ALL colors are defined.

```typescript
export const lightTheme = {
  colors: {
    primary: "#5db043", // Green
    primaryLight: "#e0ffd1",
    primaryDark: "#4a8a35",

    secondary: "#36882f", // Dark Green
    secondaryLight: "#4da83f",
    secondaryDark: "#2a6620",

    textPrimary: "#262626",
    textSecondary: "#666666",
    // ... more colors
  },
};
```

### 2. **src/config/antdTheme.ts** (AUTOMATICALLY SYNCED)

Imports from `theme.ts` and applies to Ant Design components:

```typescript
import { lightTheme } from "./theme";

export const getLightAntdTheme = (): ThemeConfig => ({
  token: {
    colorPrimary: lightTheme.colors.primary, // ✅ Synced automatically
    colorSuccess: lightTheme.colors.success, // ✅ Synced automatically
    // ...
  },
});
```

### 3. **src/styles/variables.scss** (MANUALLY SYNCED)

SCSS variables that must match `theme.ts` colors:

```scss
$primary-color: #5db043; // ⚠️ MUST match theme.ts
$secondary-color: #36882f; // ⚠️ MUST match theme.ts
// ...
```

## How to Use

### For React Components (TypeScript):

```typescript
import { lightTheme } from "../config/theme";

export const MyComponent = () => {
  return (
    <div style={{ color: lightTheme.colors.primary }}>
      Styled with theme color
    </div>
  );
};
```

### For SCSS/CSS Files:

```scss
@import "../../styles/variables.scss";

.my-component {
  color: $primary-color; // ✅ Uses SCSS variable
  background: $bg-light; // ✅ Uses SCSS variable
  border: 1px solid $border-color; // ✅ Uses SCSS variable
}
```

### For Ant Design Components:

```typescript
import { Button } from "antd";
import { getLightAntdTheme } from "../config/antdTheme";

export const MyButton = () => {
  return (
    <ConfigProvider theme={getLightAntdTheme()}>
      <Button type="primary">Primary Button</Button> {/* ✅ Uses theme color */}
    </ConfigProvider>
  );
};
```

## Changing Colors

### Option 1: Change Primary Brand Color (Easiest)

If you want to change from green to blue everywhere:

1. **Update `src/config/theme.ts`:**

```typescript
export const lightTheme = {
  colors: {
    primary: "#1890ff", // Change from #5db043 to #1890ff
    primaryLight: "#e6f7ff", // Update shades
    primaryDark: "#0050b3", // Update shades
    secondary: "#0055cc", // Update secondary
    // ...
  },
};
```

2. **Update `src/styles/variables.scss`:**

```scss
$primary-color: #1890ff; // Must match theme.ts
$primary-light: #e6f7ff; // Must match theme.ts
$primary-dark: #0050b3; // Must match theme.ts
$secondary-color: #0055cc; // Must match theme.ts
```

✅ **Result:** All React components, Ant Design, and SCSS files automatically get updated!

## Color Reference

| Property      | Value   | Usage                              |
| ------------- | ------- | ---------------------------------- |
| primary       | #5db043 | Main brand color (green)           |
| primaryLight  | #7bc758 | Light variant for backgrounds      |
| primaryDark   | #4a8a35 | Dark variant for hover states      |
| secondary     | #36882f | Secondary brand color (dark green) |
| textPrimary   | #262626 | Main text color                    |
| textSecondary | #666666 | Secondary text (gray)              |
| error         | #ff4d4f | Error/danger states (red)          |
| success       | #52c41a | Success states (green)             |
| warning       | #faad14 | Warning states (orange)            |
| info          | #1890ff | Info states (blue)                 |

## Best Practices

✅ **DO:**

- Make all color changes in `src/config/theme.ts` first
- Use `lightTheme.colors.primary` in React components
- Use `$primary-color` in SCSS files
- Keep `variables.scss` in sync with `theme.ts`

❌ **DON'T:**

- Don't hardcode color values like `#5db043` in component files
- Don't add colors only to `variables.scss` without updating `theme.ts`
- Don't use different colors for the same semantic meaning

## Maintenance Checklist

When you need to update colors:

1. ✅ Update values in `src/config/theme.ts`
2. ✅ Update corresponding values in `src/styles/variables.scss`
3. ✅ Test Ant Design components (they auto-sync)
4. ✅ Test SCSS files (they use variables)
5. ✅ Test React styled components (they import theme)

## Future Enhancement

For even better maintainability, you could:

- Generate SCSS variables from `theme.ts` automatically
- Create a build script to sync `theme.ts` ↔ `variables.scss`
- Use CSS-in-JS solution that eliminates the duplication

For now, keep them manually synced - it's the simplest working solution!
