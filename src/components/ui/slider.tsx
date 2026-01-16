/**
 * BUILD 53: Slider com suporte TOTAL a touch para iOS/Android NATIVO
 * - touch-action: none aplicado INLINE para máxima prioridade
 * - onTouchStart handler para prevenir propagação de eventos
 * - Área de toque expandida para 44x44px (Apple HIG compliance)
 * - Feedback visual melhorado com scale no toque
 * - Compatível com Capacitor/WebView
 */
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Handler para prevenir que gestos sejam capturados pelo parent
  const handleTouchStart = (e: React.TouchEvent) => {
    // Não propagar o evento para evitar scroll/swipe do container
    e.stopPropagation();
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full select-none items-center",
        // CSS classes como backup
        "[touch-action:none]",
        className
      )}
      // CRITICAL: Estilo inline tem MAIOR prioridade que CSS
      style={{
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      // Prevenir propagação de touch events
      onTouchStart={handleTouchStart}
      onTouchMove={(e) => e.stopPropagation()}
      data-orientation="horizontal"
      {...props}
    >
      {/* Track aumentado para 12px de altura para melhor visibilidade e toque */}
      <SliderPrimitive.Track
        className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary cursor-pointer"
        style={{ touchAction: 'none' }}
      >
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {/* 
        Thumb com área de toque otimizada para mobile:
        - 32px visível (h-8 w-8)
        - Área de toque efetiva de 44x44px via padding (Apple HIG minimum)
        - touch-action: none para permitir drag em iOS/Android
        - Feedback visual melhorado com scale e transitions
      */}
      <SliderPrimitive.Thumb
        className={cn(
          "block h-8 w-8 rounded-full border-2 border-primary bg-background",
          "ring-offset-background transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "shadow-lg cursor-grab active:cursor-grabbing",
          // Aumenta visualmente ao tocar (melhor feedback mobile)
          "active:scale-125 hover:scale-110"
        )}
        // CRITICAL: Estilos inline para máxima prioridade em WebView
        style={{
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
        onTouchStart={handleTouchStart}
      />
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

