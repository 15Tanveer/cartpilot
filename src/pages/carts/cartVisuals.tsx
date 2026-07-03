import React from "react";
import { Skeleton, Typography } from "antd";
import { cartAgeInDays, formatCartAge } from "./cart.utils";

const { Text } = Typography;

// A cart is "stale" (needs attention) once it has been idle beyond this.
export const STALE_CART_DAYS = 3;

/** Colour + label for the Cart Age pill: fresher carts are greener, staler
 *  carts trend to red so rows that need attention stand out at a glance. */
export const cartAgeTone = (
  isoDate: string,
): { color: string; label: string } => {
  const days = cartAgeInDays(isoDate);
  const label = formatCartAge(isoDate);
  if (Number.isNaN(days)) return { color: "default", label };
  if (days === 0) return { color: "green", label };
  if (days < STALE_CART_DAYS) return { color: "gold", label };
  return { color: "red", label };
};

/** Deterministic accent color for a user avatar, seeded by their name so the
 *  same user always gets the same tile color. */
const AVATAR_COLORS = [
  "#5db043",
  "#36882f",
  "#1890ff",
  "#722ed1",
  "#eb2f96",
  "#fa8c16",
  "#13c2c2",
];
export const avatarColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ---- At-a-glance stat tiles ----

export interface IStatTile {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  tint: string;
  hint?: string;
}

export const StatTile: React.FC<IStatTile> = ({
  label,
  value,
  icon,
  accent,
  tint,
  hint,
}) => (
  <div
    style={{
      flex: "1 1 180px",
      minWidth: 160,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "16px 18px",
      borderRadius: 10,
      background: "#ffffff",
      border: "1px solid #f0f0f0",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: tint,
        color: accent,
        fontSize: 20,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ lineHeight: 1.3, minWidth: 0 }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#262626",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {hint || label}
      </Text>
    </div>
  </div>
);

export const StatTileSkeleton: React.FC = () => (
  <div
    style={{
      flex: "1 1 180px",
      minWidth: 160,
      padding: "16px 18px",
      borderRadius: 10,
      background: "#ffffff",
      border: "1px solid #f0f0f0",
    }}
  >
    <Skeleton
      active
      title={false}
      paragraph={{ rows: 2, width: ["60%", "80%"] }}
    />
  </div>
);
