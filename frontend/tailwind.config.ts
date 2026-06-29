import type { Config } from "tailwindcss";

// LRIP design system — operational precision. Dark, dense, monochrome + accent.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#0f0f1a",
          tertiary: "#141422",
          hover: "#1a1a2e",
          active: "#1e1e38",
        },
        surface: {
          0: "#0a0a0f",
          1: "#0f0f1a",
          2: "#141422",
          3: "#1a1a2e",
        },
        border: {
          subtle: "#1e1e3a",
          DEFAULT: "#252545",
          strong: "#333366",
          focus: "#4455cc",
        },
        text: {
          primary: "#e8e8f0",
          secondary: "#8888aa",
          muted: "#555577",
          inverse: "#0a0a0f",
        },
        accent: {
          DEFAULT: "#3b5bdb",
          hover: "#4c6ef5",
          dim: "rgba(59,91,219,0.15)",
        },
        confidence: {
          high: "#22c55e",
          mod: "#f59e0b",
          low: "#f97316",
          critical: "#ef4444",
        },
        viz: {
          cpr: "#ff6b35",
          dop: "#4ecdc4",
          likelihood: "#cc66ff",
          terrain: "#88c057",
          "path-lrip": "#00e5ff",
          "path-naive": "#ff7043",
          uncertainty: "#ff0066",
          volume: "#3366ff",
        },
        status: {
          complete: "#22c55e",
          running: "#3b82f6",
          warning: "#f59e0b",
          error: "#ef4444",
          idle: "#555577",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        xs: ["11px", "16px"],
        sm: ["12px", "18px"],
        base: ["13px", "20px"],
        md: ["14px", "22px"],
        lg: ["16px", "24px"],
        xl: ["20px", "28px"],
        "2xl": ["24px", "32px"],
        "3xl": ["32px", "40px"],
        "4xl": ["48px", "56px"],
      },
      borderRadius: {
        sm: "3px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        e1: "0 1px 3px rgba(0,0,0,0.5)",
        e2: "0 4px 12px rgba(0,0,0,0.6)",
        e3: "0 8px 24px rgba(0,0,0,0.7)",
        e4: "0 16px 48px rgba(0,0,0,0.8)",
      },
      transitionTimingFunction: {
        default: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
