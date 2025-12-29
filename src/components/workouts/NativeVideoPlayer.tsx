import React, { useRef, useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface NativeVideoPlayerProps {
    videoUrl: string | null;
    posterUrl?: string | null;
    autoPlay?: boolean;
}

export default function NativeVideoPlayer({ videoUrl, posterUrl, autoPlay = false }: NativeVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (videoUrl) {
            setLoading(true);
            setError(false);
        }
    }, [videoUrl]);

    const handleLoadedData = () => {
        setLoading(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    if (!videoUrl) {
        return (
            <div className="w-full aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhum vídeo disponível para esta aula.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg group">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
            )}

            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10 text-center p-4">
                    <AlertCircle className="w-8 h-8 text-destructive mb-2" />
                    <p className="text-sm font-medium text-foreground">Erro ao carregar o vídeo</p>
                    <p className="text-xs text-muted-foreground mt-1">Tente recarregar a página</p>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    src={videoUrl}
                    poster={posterUrl || undefined}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                    autoPlay={autoPlay}
                    loop={true}
                    muted={false}
                    onLoadedData={handleLoadedData}
                    onError={handleError}
                    controlsList="nodownload"
                >
                    Seu dispositivo não suporta a reprodução de vídeos.
                </video>
            )}
        </div>
    );
}
