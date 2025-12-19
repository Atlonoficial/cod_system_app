import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export const LoadingScreen = () => {
  const [showError, setShowError] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animação dos pontos
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Countdown visual
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timeout para erro
    const timeout = setTimeout(() => {
      setShowError(true);
    }, 8000);

    return () => {
      clearTimeout(timeout);
      clearInterval(countdownInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  if (showError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Carregamento Demorado</h1>
          <p className="text-gray-400 text-sm">
            O app está demorando mais que o esperado para carregar.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-[#4A90A4] to-[#2ECC71] hover:opacity-90 text-white font-semibold h-12 rounded-xl"
          >
            Tentar Novamente
          </Button>
          <Button
            onClick={async () => {
              if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
              }
              localStorage.clear();
              try {
                const { Capacitor } = await import('@capacitor/core');
                if (Capacitor.isNativePlatform()) {
                  const { Preferences } = await import('@capacitor/preferences');
                  await Preferences.clear();
                }
              } catch (e) {
                // Ignorar
              }
              window.location.reload();
            }}
            variant="outline"
            className="w-full text-white border-gray-700 h-12 rounded-xl hover:bg-white/5"
          >
            Limpar Cache e Reiniciar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        {/* Logo COD */}
        <div className="mb-10">
          <img
            src="/cod-logo.png"
            alt="COD System"
            className="h-24 w-auto mx-auto drop-shadow-2xl"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
        </div>

        {/* Loader animado com gradiente da marca */}
        <div className="relative w-16 h-16 mx-auto mb-8">
          {/* Círculo externo com gradiente */}
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, transparent, #4A90A4, #2ECC71, transparent)',
              animationDuration: '1.2s'
            }}
          />
          {/* Centro preto */}
          <div className="absolute inset-[3px] rounded-full bg-[#0a0a0a]" />
        </div>

        {/* Texto */}
        <p className="text-white text-lg font-medium tracking-wide">
          Carregando{dots}
        </p>
        <p className="text-gray-500 mt-2 text-sm">
          Inicializando aplicativo
        </p>

        {/* Countdown discreto */}
        {countdown > 0 && countdown < 8 && (
          <p className="text-gray-600 mt-6 text-xs">
            {countdown}s
          </p>
        )}
      </div>
    </div>
  );
};
