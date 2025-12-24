import { useCallback } from "react";
import { ArrowLeft, Play, ChevronDown, Dumbbell, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "./VideoPlayer";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useNavigate } from "react-router-dom";

interface ExerciseDetailProps {
  exercise: {
    id: number;
    name: string;
    type: string;
    sets?: string;
    reps?: string;
    duration?: string | number;
    rest?: string;
    description?: string;
    load?: number;
    load_unit?: 'kg' | '%' | 'lbs';
    tempo_cadence?: string;
    cycles?: number;
  };
  workout?: {
    id: number;
    name: string;
    type: string;
    duration: number;
    difficulty: string;
  };
  onBack: () => void;
  onStartExercise: () => void;
}

export const ExerciseDetail = ({ exercise, workout, onBack, onStartExercise }: ExerciseDetailProps) => {
  const navigate = useNavigate();

  const handleTabChange = useCallback((tab: string) => {
    navigate(`/${tab === 'home' ? '' : tab}`);
  }, [navigate]);

  // Formatar carga com unidade
  const formatLoad = () => {
    if (!exercise.load) return null;
    const unit = exercise.load_unit || 'kg';
    return `${exercise.load} ${unit}`;
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header with background image */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-8 left-4 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm border border-white/20 flex items-center justify-center z-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Exercise info */}
        <div className="relative z-10 mt-auto p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{workout?.name || "Treino"}</h1>
          <p className="text-white/80 mb-4">{workout?.type || exercise.type}</p>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{workout?.duration || "40"} min</span>
              <span className="text-xs text-white/60">Duração</span>
            </div>

            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-2 rounded-xl">
              <Dumbbell className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{workout?.difficulty || "Moderado"}</span>
              <span className="text-xs text-white/60">Dificuldade</span>
            </div>

            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-2 rounded-xl">
              <Dumbbell className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">2</span>
              <span className="text-xs text-white/60">Exercícios</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise details */}
      <div className="p-4 pb-safe-xl">
        <h2 className="text-xl font-bold text-foreground mb-4">Exercícios</h2>

        {/* Exercise card */}
        <div className="bg-surface/50 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{exercise.name}</h3>
              <p className="text-muted-foreground text-sm">{exercise.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Play className="w-5 h-5 text-white ml-0.5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-surface/50 border border-border/30 flex items-center justify-center">
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Exercise specs */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-accent" />
              <span className="text-foreground font-medium">
                {exercise.sets || "3"} séries x {exercise.reps || "8-12"} reps
                {exercise.cycles && exercise.cycles > 1 && ` (${exercise.cycles} ciclos)`}
              </span>
            </div>

            {formatLoad() && (
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-accent" />
                <span className="text-foreground font-medium">
                  Carga: {formatLoad()}
                </span>
              </div>
            )}

            {exercise.tempo_cadence && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-foreground font-medium">
                  Cadência: {exercise.tempo_cadence}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-accent" />
              <span className="text-foreground font-medium">
                Descanso: {exercise.rest || "60s"}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-accent mt-0.5" />
              <span className="text-foreground">
                {exercise.description || "Exercício completo para queima de calorias"}
              </span>
            </div>
          </div>

          {/* Video Player */}
          <VideoPlayer exerciseName={exercise.name} className="mb-4" />
        </div>
      </div>

      {/* Start workout button */}
      <div className="fixed bottom-safe left-4 right-4 z-fixed">
        <Button
          onClick={onStartExercise}
          className="w-full h-14 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-background font-semibold text-lg rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          <Play className="w-5 h-5 mr-2" />
          Iniciar Treino
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="workouts" onTabChange={handleTabChange} />
    </div>
  );
};