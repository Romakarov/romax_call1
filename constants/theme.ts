import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#1A1A1A",
    textSecondary: "#A8A8A8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#A8A8A8",
    tabIconSelected: "#4B61FF",
    link: "#4B61FF",
    accent: "#4B61FF",
    accentLight: "#4B61FF20",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F5F5F5",
    backgroundSecondary: "#EDEDED",
    backgroundTertiary: "#DADADA",
    border: "#DADADA",
    borderLight: "#EDEDED",
    error: "#FF4B4B",
    success: "#34C759",
    online: "#34C759",
    messageSent: "#4B61FF",
    messageReceived: "#F5F5F5",
    inputBackground: "#FFFFFF",
    overlay: "rgba(0,0,0,0.5)",
    overlayDark: "rgba(0,0,0,0.9)",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#4B61FF",
    link: "#4B61FF",
    accent: "#4B61FF",
    accentLight: "#4B61FF30",
    backgroundRoot: "#1A1A1A",
    backgroundDefault: "#2A2C2E",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    border: "#404244",
    borderLight: "#353739",
    error: "#FF6B6B",
    success: "#34C759",
    online: "#34C759",
    messageSent: "#4B61FF",
    messageReceived: "#2A2C2E",
    inputBackground: "#2A2C2E",
    overlay: "rgba(0,0,0,0.7)",
    overlayDark: "rgba(0,0,0,0.95)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  avatarSmall: 40,
  avatarMedium: 48,
  avatarLarge: 80,
  messageBubbleMaxWidth: "75%",
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  full: 9999,
  message: 16,
  input: 8,
  button: 8,
  avatar: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
