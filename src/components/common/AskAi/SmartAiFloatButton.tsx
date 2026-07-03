import React from "react";
import { ThunderboltFilled } from "@ant-design/icons";

interface SmartAiFloatButtonProps {
  onClick: () => void;
  /** Hidden until the carts have loaded so it can't be clicked with no data. */
  visible?: boolean;
}

/**
 * Compact, interactive floating action button for "Smart AI Suggestions".
 * A small pill that sits bottom-right: it gently pulses to draw the eye, lifts
 * and brightens on hover, and expands its label on hover so it stays small at
 * rest but is obvious on interaction. Self-contained (scoped keyframes) since
 * the project has no CSS-in-JS library.
 */
const SmartAiFloatButton: React.FC<SmartAiFloatButtonProps> = ({
  onClick,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes smartAiPulse {
          0%   { box-shadow: 0 4px 14px rgba(93,176,67,0.35), 0 0 0 0 rgba(93,176,67,0.45); }
          70%  { box-shadow: 0 4px 14px rgba(93,176,67,0.35), 0 0 0 10px rgba(93,176,67,0); }
          100% { box-shadow: 0 4px 14px rgba(93,176,67,0.35), 0 0 0 0 rgba(93,176,67,0); }
        }
        @keyframes smartAiSpark {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50%      { transform: rotate(-12deg) scale(1.15); }
        }
        .smart-ai-fab {
          position: fixed;
          right: 28px;
          bottom: 28px;
          z-index: 1000;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 16px;
          border: none;
          border-radius: 22px;
          cursor: pointer;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          background: linear-gradient(135deg, #5db043 0%, #36882f 100%);
          animation: smartAiPulse 2.4s ease-out infinite;
          transition: transform 0.18s ease, filter 0.18s ease, padding 0.18s ease;
        }
        .smart-ai-fab:hover {
          transform: translateY(-3px);
          filter: brightness(1.06);
          animation-play-state: paused;
          box-shadow: 0 8px 22px rgba(54,136,47,0.45);
        }
        .smart-ai-fab:active {
          transform: translateY(-1px) scale(0.97);
        }
        .smart-ai-fab__icon {
          font-size: 16px;
          display: inline-flex;
        }
        .smart-ai-fab:hover .smart-ai-fab__icon {
          animation: smartAiSpark 0.6s ease-in-out;
        }
        /* Collapse to a neat circular icon at rest; reveal the label on hover. */
        .smart-ai-fab__label {
          max-width: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-width 0.22s ease, opacity 0.18s ease;
        }
        .smart-ai-fab:hover .smart-ai-fab__label,
        .smart-ai-fab:focus-visible .smart-ai-fab__label {
          max-width: 160px;
          opacity: 1;
        }
        @media (max-width: 576px) {
          .smart-ai-fab { right: 16px; bottom: 16px; }
        }
      `}</style>
      <button
        type="button"
        className="smart-ai-fab"
        onClick={onClick}
        aria-label="Smart AI Suggestions"
        title="Study cart totals & age to suggest promotions"
      >
        <span className="smart-ai-fab__icon">
          <ThunderboltFilled />
        </span>
        <span className="smart-ai-fab__label">Smart AI Suggestions</span>
      </button>
    </>
  );
};

export default SmartAiFloatButton;
