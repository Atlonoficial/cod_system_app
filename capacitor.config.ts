// capacitor.config.ts
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
      'https://bqbopkqzkavhmenjlhab.supabase.co',

      '*.lovableproject.com',
      'https://*.lovable.app'
    ]
  },


  ios: {
    scheme: "codsystem",
    contentInset: "automatic",
    backgroundColor: "#000000",
    allowsLinkPreview: false,
    handleApplicationNotifications: false,



    // ✅ Desabilitar bounce/overscroll nativo do iOS
    scrollEnabled: false,


  },

  android: {
    backgroundColor: "#000000",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: "COD SYSTEM/1.0",
    overrideUserAgent: "[APP_NAME]/1.0 Mobile App",




  },

  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
    },
    Keyboard: { resize: "native", style: "dark", resizeOnFullScreen: true },
    StatusBar: { style: "dark", backgroundColor: "#000000" },
    Camera: { permissions: ["camera", "photos"] },
  },
};

export default config;
