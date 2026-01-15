/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COD SYSTEM - Capacitor Configuration
 * Version: 1.0.0 | Build: 20
 * ═══════════════════════════════════════════════════════════════════════════
 * @copyright (c) 2024-2026 Atlon Tech (CNPJ: 58.079.600/0001-77)
 * All intellectual property rights reserved to Atlon Tech
 * ═══════════════════════════════════════════════════════════════════════════
 */
import type { CapacitorConfig } from "@capacitor/cli";

// Detecta produção/CI (Appflow exporta CI/Appflow vars)
const isCIOrProd =
  process.env.NODE_ENV === "production" ||
  process.env.CI === "true" ||
  process.env.APPFLOW_BUILD === "true";

// Em DEV você pode setar VITE_CAP_SERVER_URL para hot-reload;
// em produção/CI isso será sempre ignorado.
const serverUrlEnv = (process.env.VITE_CAP_SERVER_URL || "").trim();
const maybeServer =
  !isCIOrProd && serverUrlEnv
    ? { server: { url: serverUrlEnv, cleartext: true } }
    : {};

const config: CapacitorConfig = {
  appId: "com.atlontech.codsystem.app",
  appName: "COD SYSTEM",
  webDir: "dist",
  backgroundColor: "#000000",

  // Em PROD/CI não terá server.url
  ...maybeServer,

  server: {
    ...(maybeServer as any).server,
    cleartext: true,
    allowNavigation: [
      'https://swvpuadolibssbhiozje.supabase.co
    ]
  },


  ios: {
    scheme: "codsystem",
    contentInset: "automatic",
    // ✅ BUILD 18: Cor do background do app para safe area profissional
    // hsl(214.3, 36.8%, 7.5%) = #0d1117 (dark blue matching app theme)
    backgroundColor: "#0d1117",
    allowsLinkPreview: false,
    handleApplicationNotifications: false,

    // ✅ BUILD 18: Scroll nativo habilitado para permitir scroll do conteúdo
    // Header e footer permanecem fixos via CSS (position: fixed)

  },

  android: {
    // ✅ BUILD 18: Cor do background consistente com iOS
    backgroundColor: "#0d1117",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: "COD SYSTEM/1.0",
    overrideUserAgent: "COD SYSTEM/1.0.0 Mobile App",




  },

  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      // ✅ BUILD 18: Cor consistente com o tema do app
      backgroundColor: "#0d1117",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
    },
    Keyboard: { resize: "native", style: "dark", resizeOnFullScreen: true },
    StatusBar: { style: "dark", backgroundColor: "#0d1117" },
    Camera: { permissions: ["camera", "photos"] },
  },
};

export default config;
