import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Capacitor } from '@capacitor/core';
import { initializeDeepLinkHandler } from '@/utils/deepLinkHandler';
import { createCapacitorStorage } from '@/lib/capacitorStorage';
import { bootManager } from '@/lib/bootManager';
import { logger } from '@/lib/logger';

logger.info('Boot', '🔄 STEP 0: main.tsx loaded');

// ✅ NOVO: Health check para validar cada etapa do boot
const bootHealthCheck = {
  steps: [] as string[],
  addStep(step: string) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    this.steps.push(`${timestamp} - ${step}`);
    logger.info('Boot Health', `✅ ${step}`);
  },
  getStatus() {
    return this.steps.join('\n');
  }
};

(window as any).__bootHealthCheck = bootHealthCheck; // ✅ Disponível no console
bootHealthCheck.addStep('STEP 0: main.tsx loaded');

// Aguardar Capacitor estar completamente pronto
const waitForCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    const isIOS = platform === 'ios';

    logger.info('Boot', '🔄 STEP 2: Native platform detected', {
      platform,
      isIOS,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    });
    bootHealthCheck.addStep('STEP 2: Native platform detected');

    // ✅ BUILD 49: Tempo reduzido para iOS
    const waitTime = isIOS ? 200 : 100;
    logger.info('Boot', `⏳ Waiting ${waitTime}ms for plugins...`);
    bootHealthCheck.addStep(`STEP 3: Waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    bootHealthCheck.addStep('STEP 3: Wait complete');

    // ✅ BUILD 51: NUNCA aguardar storage - Supabase usa localStorage imediatamente
    logger.info('Boot', '🔐 STEP 4: Creating Supabase client (no storage wait)...', {
      timestamp: Date.now()
    });
    bootHealthCheck.addStep('STEP 4: Creating Supabase client');

    try {
      // ✅ Import Supabase IMEDIATAMENTE (sem aguardar storage)
      const supabaseModule = await import('@/integrations/supabase/client');
      const supabase = supabaseModule.getSupabase();

      logger.info('Boot', '✅ STEP 5: Supabase client ready', {
        timestamp: Date.now()
      });
      bootHealthCheck.addStep('STEP 5: Supabase client ready');

      // ✅ BUILD 51: Inicializar storage EM BACKGROUND (não bloquear boot)
      // Modificado: Executar para TODAS as plataformas nativas (Android e iOS)
      setTimeout(async () => {
        try {
          logger.info('Boot', 'Background: Initializing Capacitor Storage...');
          await createCapacitorStorage();
          logger.info('Boot', '✅ Background: Storage initialized');
        } catch (err) {
          logger.warn('Boot', 'Background: Storage init failed, continuing with localStorage:', err);
        }
      }, 1000); // Aguardar 1s após boot

      // ✅ Health check em background (não bloquear)
      setTimeout(async () => {
        try {
          const { checkDatabaseHealth } = await import('@/lib/supabase');
          const isHealthy = await checkDatabaseHealth();
          logger.info('Boot', 'Background health check:', isHealthy ? 'healthy' : 'slow');
        } catch (err) {
          logger.warn('Boot', 'Background health check failed:', err);
        }
      }, 2000);

    } catch (error) {
      // ✅ BUILD 51: Se Supabase falhar, é erro crítico (mas não deve acontecer)
      logger.error('Boot', '❌ CRITICAL: Supabase init failed:', error);
      bootHealthCheck.addStep('STEP 4: Supabase FAILED');
      throw new Error(`Boot initialization failed: ${error}`);
    }

    logger.info('Boot', '🎯 STEP 8: Ready to render React', {
      timestamp: Date.now(),
      totalTime: `${Date.now() - performance.now()}ms`
    });
    bootHealthCheck.addStep('STEP 8: Ready to render');
  }
};

(async () => {
  // ✅ BUILD 51: Timeout de emergência reduzido para 5s
  const emergencyTimeout = setTimeout(() => {
    logger.error('Boot', '🚨 EMERGENCY: Boot taking too long (5s), forcing render');

    bootManager.markBootComplete();

    // ✅ BUILD 51: NUNCA usar StrictMode em nativo ou produção
    const isNative = Capacitor.isNativePlatform();
    const IS_PRODUCTION = import.meta.env.PROD;
    const AppWrapper = (isNative || IS_PRODUCTION) ? <App /> : <StrictMode><App /></StrictMode>;

    createRoot(document.getElementById('root')!).render(AppWrapper);

    // Esconder loader
    const loader = document.getElementById('native-loader');
    if (loader) loader.remove();
  }, 5000); // 8s → 5s (mais agressivo)

  try {
    logger.debug('Boot', '🔄 STEP 1: Starting boot sequence...');

    if (Capacitor.isNativePlatform()) {
      await waitForCapacitor();

      logger.info('Boot', '🚀 Starting native platform initialization...');
      logger.debug('Boot', 'Platform:', Capacitor.getPlatform());

      // LOGGING APRIMORADO: Capturar TODOS os erros com detalhes completos
      window.addEventListener('error', (e) => {
        const errorDetails = {
          message: e?.error?.message || e?.message || 'Unknown error',
          stack: e?.error?.stack || 'No stack trace',
          filename: e.filename || 'Unknown file',
          lineno: e.lineno || 0,
          colno: e.colno || 0,
          timestamp: new Date().toISOString()
        };

        logger.error('Boot', '❌ CRITICAL ERROR:', JSON.stringify(errorDetails, null, 2));
      });

      window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
        const rejectionDetails = {
          reason: e?.reason?.message || e?.reason || 'Unknown rejection',
          stack: e?.reason?.stack || 'No stack trace',
          timestamp: new Date().toISOString()
        };

        logger.error('Boot', '❌ UNHANDLED PROMISE REJECTION:', JSON.stringify(rejectionDetails, null, 2));
      });

      // Inicializa deep links com segurança
      try {
        logger.info('Boot', '🔗 Initializing deep link handler...');
        initializeDeepLinkHandler();
        logger.info('Boot', '✅ Deep link handler initialized');
      } catch (err) {
        logger.error('Boot', '❌ DeepLink init failed:', err);
      }

      logger.info('Boot', '✅ Native initialization complete');
    } else {
      logger.debug('Boot', 'ℹ️ STEP 2: Web platform detected, skipping native init');
      logger.debug('Boot', '📝 Note: capacitorStorage will NOT be initialized (using localStorage)');
      logger.debug('Boot', '🔍 BUILD 47: Capacitor detection:', {
        isNativePlatform: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
        CapacitorExists: typeof (window as any).Capacitor !== 'undefined'
      });
    }

    // ✅ BUILD 26: Marcar boot como completo (WEB + NATIVO)
    logger.info('Boot', '🎯 STEP 8: Marking boot as complete');
    bootManager.markBootComplete();
    bootHealthCheck.addStep('STEP 8: Boot marked complete');

    // ✅ BUILD 48: Cancelar emergency timeout
    clearTimeout(emergencyTimeout);

    // ✅ BUILD 26: Aguardar 50ms para garantir propagação do flag
    logger.info('Boot', '⏳ STEP 8.5: Waiting 50ms for flag propagation...');
    await new Promise(resolve => setTimeout(resolve, 50));

    // ✅ BUILD 51: Renderizar React NUNCA com StrictMode em nativo ou produção
    logger.info('Boot', '🔄 STEP 9: Rendering React application...');

    const isNative = Capacitor.isNativePlatform();
    const IS_PRODUCTION = import.meta.env.PROD;

    // ✅ NUNCA usar StrictMode em produção ou plataforma nativa
    const AppWrapper = (isNative || IS_PRODUCTION) ? (
      <App />
    ) : (
      <StrictMode>
        <App />
      </StrictMode>
    );

    createRoot(document.getElementById('root')!).render(AppWrapper);
    bootHealthCheck.addStep('STEP 9: React rendered');

    // ✅ Esconder loader nativo DEPOIS de React renderizar
    logger.info('Boot', '🔄 STEP 10: React rendered, hiding native loader...');
    setTimeout(() => {
      const nativeLoader = document.getElementById('native-loader');
      if (nativeLoader) {
        nativeLoader.classList.add('hidden');
        logger.info('Boot', '✅ STEP 11: Native loader hidden');
        setTimeout(() => {
          nativeLoader.remove();
          logger.info('Boot', '✅ STEP 12: Native loader removed from DOM');
        }, 500);
      }
    }, 100);

  } catch (error) {
    clearTimeout(emergencyTimeout);
    // ✅ BUILD 21: SEMPRE esconder loader mesmo com erro
    logger.error('Boot', '❌ FATAL ERROR:', error);

    const loader = document.getElementById('native-loader');
    if (loader) loader.remove();

    // ✅ Mostrar tela de erro ao invés de tela preta
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.innerHTML = `
        <div style="min-height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; padding: 20px;">
          <div style="text-align: center; max-width: 400px;">
            <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
            <h1 style="color: white; font-size: 24px; margin-bottom: 10px; font-family: system-ui;">Erro ao Iniciar</h1>
            <p style="color: #9ca3af; margin-bottom: 20px; font-family: system-ui;">Não foi possível inicializar o aplicativo.</p>
            <button 
              onclick="window.location.reload()" 
              style="background: #eab308; color: black; padding: 12px 24px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; font-family: system-ui;"
            >
              🔄 Tentar Novamente
            </button>
            <details style="margin-top: 20px; text-align: left; color: #6b7280; font-size: 12px; font-family: monospace;">
              <summary style="cursor: pointer; font-family: system-ui;">Detalhes técnicos</summary>
              <pre style="margin-top: 10px; padding: 10px; background: #1f2937; border-radius: 4px; overflow: auto; white-space: pre-wrap; word-break: break-word;">${error}</pre>
            </details>
          </div>
        </div>
      `;
    }
  }
})();
