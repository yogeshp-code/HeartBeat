export const themeConfig = {
  colors: {
    primary: {
      DEFAULT: "#FF4560", 
      hover: "#FF6B7D",
      light: "#FF8A98",
      dark: "#D93850",
    },
    secondary: {
      DEFAULT: "#00E396", 
      hover: "#33E9AA",
      light: "#66EFBE",
      dark: "#00B377",
    },
    accent: {
      DEFAULT: "#008FFB", 
      hover: "#33A5FC",
      light: "#66BBFD",
      dark: "#0072C9",
    },
    warning: {
      DEFAULT: "#FEB019", 
      hover: "#FEC046",
      light: "#FED073",
      dark: "#CB8D14",
    },
    background: {
      dark: "#1A1C22", 
      darker: "#13151A", 
      card: "#22252D", 
      overlay: "#2A2E39", 
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B3B8C2",
      muted: "#7A8194",
      inverse: "#13151A",
    },
    grid: {
      line: "rgba(255, 69, 96, 0.1)", 
      highlight: "rgba(255, 69, 96, 0.2)", 
    },
  },
  fonts: {
    sans: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  animation: {
    pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    fadeIn: "fadeIn 0.5s ease-in-out",
    slideUp: "slideUp 0.5s ease-out",
    heartbeat: "heartbeat 1.5s ease-in-out infinite",
  },
  keyframes: {
    pulse: {
      "0%, 100%": { opacity: "1" },
      "50%": { opacity: "0.5" },
    },
    fadeIn: {
      "0%": { opacity: "0" },
      "100%": { opacity: "1" },
    },
    slideUp: {
      "0%": { transform: "translateY(20px)", opacity: "0" },
      "100%": { transform: "translateY(0)", opacity: "1" },
    },
    heartbeat: {
      "0%": { transform: "scale(1)" },
      "14%": { transform: "scale(1.1)" },
      "28%": { transform: "scale(1)" },
      "42%": { transform: "scale(1.1)" },
      "70%": { transform: "scale(1)" },
    },
  },
}
