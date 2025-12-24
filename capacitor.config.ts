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
  bundledWebRuntime: false,
  backgroundColor: "#000000",
  version: "1.0.0",

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

  deepLinkingConfig: {
    customURLScheme: 'codsystem'
  },

  ios: {
    scheme: "codsystem",
    contentInset: "automatic",
    backgroundColor: "#000000",
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
    CFBundleVersion: '3',
    CFBundleShortVersionString: "1.0.0",

    // ✅ Desabilitar bounce/overscroll nativo do iOS
    scrollEnabled: false,

    // Tudo aqui vira Info.plist do app (garantido a cada build)
    plist: {
      // ---- Privacidade (evita ITMS-90683) ----
      NSPhotoLibraryUsageDescription:
        "Este app precisa acessar suas fotos para permitir que você adicione fotos de progresso e compartilhe conquistas.",
      NSPhotoLibraryAddUsageDescription:
        "Precisamos salvar imagens na sua galeria quando você exporta ou baixa mídias pelo app.",
      NSCameraUsageDescription:
        "Precisamos da câmera para tirar fotos dentro do app.",
      NSUserTrackingUsageDescription:
        "Este app usa dados de atividade para personalizar sua experiência de treino e fornecer conteúdo relevante.",

      // ---- Localização ----
      NSLocationWhenInUseUsageDescription:
        "Usamos sua localização para melhorar sua experiência no app.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Usamos sua localização para melhorar sua experiência no app.",

      // ---- HealthKit (COD System - Biometric Sync) ----
      NSHealthShareUsageDescription:
        "Usamos dados de sono e frequência cardíaca do Apple Health para personalizar seu treino e acompanhar sua recuperação.",
      NSHealthUpdateUsageDescription:
        "Registramos suas sessões de treino no Apple Health para manter um histórico completo.",

      // Criptografia
      ITSAppUsesNonExemptEncryption: false,

      // FASE 4: Block landscape on iPhone, allow on iPad for multitasking
      UISupportedInterfaceOrientations: [
        "UIInterfaceOrientationPortrait",
      ],
      "UISupportedInterfaceOrientations~ipad": [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationPortraitUpsideDown",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight",
      ],

      // Launch screen baseado em storyboard (exigido pelo iPad multitasking)
      UILaunchStoryboardName: "LaunchScreen",

      // *** Versões (garantem sincronização em todos os builds)
      CFBundleShortVersionString: "1.0.0",
      CFBundleVersion: "3",
    },
  },

  android: {
    backgroundColor: "#000000",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: "COD SYSTEM/1.0",
    overrideUserAgent: "[APP_NAME]/1.0 Mobile App",
    hideLogs: true,
    cleartext: true,
    networkSecurityConfig: true,
    versionCode: 3,
    versionName: "1.0.0"
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
