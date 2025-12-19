import { Loader2 } from "lucide-react";
import { useExerciseVideo } from "@/hooks/useExerciseVideo";
import NativeVideoPlayer from "./NativeVideoPlayer";

interface VideoPlayerProps {
  exerciseName: string;
  videoUrl?: string;
  className?: string;
}

export const VideoPlayer = ({ exerciseName, videoUrl, className = "" }: VideoPlayerProps) => {
  // Only search by name if no direct videoUrl is provided
  const shouldSearchByName = !videoUrl && exerciseName;
  const { exercise, loading, videoUrl: exerciseVideoUrl } = useExerciseVideo(
    shouldSearchByName ? exerciseName : ''
  );

  // Priority: 1) Direct videoUrl prop, 2) Search result from hook
  const finalVideoUrl = videoUrl || exerciseVideoUrl;

  // Show loader only when searching by name
  if (shouldSearchByName && loading) {
    return (
      <div className={`relative aspect-video bg-surface/30 rounded-xl flex items-center justify-center border border-border/20 overflow-hidden ${className}`}>
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="text-sm text-foreground">Carregando vídeo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mostrar mensagem quando exercício existe mas não tem vídeo */}
      {shouldSearchByName && exercise && !finalVideoUrl ? (
        <div className="relative aspect-video bg-surface/30 rounded-xl flex flex-col items-center justify-center border border-border/20 overflow-hidden p-4">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <Loader2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium text-sm text-center">
            Vídeo em breve
          </p>
          <p className="text-muted-foreground text-xs text-center mt-1">
            {exercise.name}
          </p>
        </div>
      ) : (
        <NativeVideoPlayer
          videoUrl={finalVideoUrl || null}
          posterUrl={exercise?.image_url}
          autoPlay={false}
        />
      )}

      {/* Overlay with exercise info - only when searching by name */}
      {shouldSearchByName && exercise && finalVideoUrl && (
        <div className="mt-2 px-1">
          <p className="text-foreground font-medium text-sm truncate">
            {exercise.name}
          </p>
          {exercise.name !== exerciseName && (
            <p className="text-muted-foreground text-xs truncate">
              Treino: {exerciseName}
            </p>
          )}
        </div>
      )}
    </div>
  );
};