import { useEffect, useMemo, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBanners } from "@/hooks/useBanners";
import { useBannerTracking } from "@/hooks/useBannerTracking";
import { openExternalLink } from "@/utils/openExternalLink";

interface AnnouncementBannerProps {
  userId?: string;
}

export const AnnouncementBanner = ({ userId }: AnnouncementBannerProps) => {
  const { banners, loading } = useBanners(userId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Updated tracking with new types
  const { trackView, trackClick } = useBannerTracking();

  const current = banners[currentIndex];

  // Rotaciona automaticamente apenas se não estiver expandido
  useEffect(() => {
    if (!banners.length || isExpanded) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, isExpanded]);

  const gradient = useMemo(() => {
    const type = current?.type || 'campanha';
    if (type === 'produto') return 'from-primary/10 to-primary-variant/10';
    if (type === 'noticia') return 'from-accent/10 to-accent-variant/10';
    return 'from-secondary/10 to-secondary-variant/10';
  }, [current]);

  const imageSrc = current?.image_url || "/placeholder.svg";
  const actionLabel = current?.action_text || 'Saiba Mais';
  const linkUrl = current?.action_url;
  const tagType = current?.type || 'campanha';

  // MÉTRICA 2: Click - Clique no botão de ação
  const handleRedirectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkUrl && current?.id) {
      trackClick(current.id, { actionUrl: linkUrl });
      // Pequeno delay para garantir que o tracking seja enviado
      setTimeout(() => {
        openExternalLink(linkUrl);
      }, 100);
    }
  };

  // MÉTRICA 1: View - Clique no card do banner
  const handleBannerClick = () => {
    if (current?.id) {
      trackView(current.id, { placement: 'dashboard' });

      if (!isExpanded) {
        setIsExpanded(true);
        // Auto-hide after 4 seconds
        setTimeout(() => {
          setIsExpanded(false);
        }, 4000);
      }
    }
  };

  if (loading) {
    return (
      <div className="relative mb-6 overflow-hidden rounded-xl border border-border/50">
        <div className="bg-gradient-to-r from-muted/10 to-muted/20 p-4">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-lg bg-muted" />
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3 mb-3" />
              <div className="h-7 bg-muted rounded w-28" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!banners.length) {
    console.log('[AnnouncementBanner] ℹ️ No banners to display');
    return null;
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border border-border/50">
      <div
        className={`bg-gradient-to-r ${gradient} p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02]`}
        onClick={handleBannerClick}
      >
        {/* 16:9 aspect ratio banner with image background */}
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <img
            src={imageSrc}
            alt={current?.title || 'Banner'}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

          {/* Content overlay */}
          <div className="absolute inset-0 p-4 flex items-center justify-center">
            {/* Collapsed State - Only show expand indicator */}
            {!isExpanded && (
              <div className="text-center text-white">
                <ChevronDown size={32} className="mx-auto animate-pulse" />
                <p className="text-sm mt-2 opacity-80">Clique para ver detalhes</p>
              </div>
            )}

            {/* Expanded State - Show all content */}
            {isExpanded && (
              <div className="w-full animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${tagType === 'produto' ? 'bg-primary/30 text-white border border-primary/50' : 'bg-accent/30 text-white border border-accent/50'
                    }`}>
                    📢 Campanha
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
                  {current?.title}
                </h3>

                {(current?.description || current?.message) && (
                  <p className="text-sm text-white/90 mb-3 line-clamp-2">
                    {current.description || current.message}
                  </p>
                )}

                {linkUrl && (
                  <button
                    onClick={handleRedirectClick}
                    className="self-start text-sm bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2 backdrop-blur-sm border border-white/20"
                  >
                    <span>{actionLabel}</span>
                    <ExternalLink size={14} />
                  </button>
                )}

                {/* Collapse indicator */}
                <div className="flex justify-center mt-3">
                  <ChevronUp size={20} className="text-white/60 animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controles - apenas visíveis quando expandido e há múltiplos banners */}
      {isExpanded && banners.length > 1 && (
        <>
          <div className="absolute top-1/2 left-2 -translate-y-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = (currentIndex - 1 + banners.length) % banners.length;
                setCurrentIndex(newIndex);
              }}
              className="w-6 h-6 bg-background/80 hover:bg-background border border-border rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
          </div>

          <div className="absolute top-1/2 right-2 -translate-y-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = (currentIndex + 1) % banners.length;
                setCurrentIndex(newIndex);
              }}
              className="w-6 h-6 bg-background/80 hover:bg-background border border-border rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </>
      )}

      {/* Indicadores - apenas visíveis quando expandido e há múltiplos banners */}
      {isExpanded && banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
