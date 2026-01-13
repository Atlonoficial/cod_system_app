import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Clock, Flame, Dumbbell, Play, ChevronDown, CheckCircle2, X, Zap, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "./VideoPlayer";
import { useExerciseVideo } from "@/hooks/useExerciseVideo";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useNavigate } from "react-router-dom";
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { RichTextRenderer } from '@/components/ui/RichTextRenderer';

interface Exercise {
  id: number;
  name: string;
  type: string;
  sets?: string;
  reps?: string;
  duration?: string;
  rest?: string;
  description?: string;
}

interface WorkoutDetailProps {
  workout: {
    id: number;
    name: string;
    type: string;
    duration: number;
    difficulty: string;
    exercises: Exercise[];
    image?: string;
  };
  onBack: () => void;
  onStartWorkout: () => void;
  onExerciseSelect?: (exercise: Exercise) => void;
}

// Componente para exibir nome do exercício com informações da base de dados
const ExerciseNameDisplay = ({ exerciseName }: { exerciseName: string }) => {
  const { exercise, loading } = useExerciseVideo(exerciseName);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <h3 className="font-bold text-foreground mb-1 text-lg">
          {exercise?.name || exerciseName}
        </h3>
        {exercise?.name && exercise.name !== exerciseName && (
          <p className="text-xs text-muted-foreground">
            Treino: {exerciseName}
          </p>
        )}
      </div>
      {exercise?.video_url && (
        <div title="Vídeo disponível">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </div>
      )}
    </div>
  );
};

// Componente para exibir informações completas do exercício
const ExerciseInfoDisplay = ({ exerciseName }: { exerciseName: string }) => {
  const { exercise, loading } = useExerciseVideo(exerciseName);

  if (loading || !exercise) return null;

  return (
    <div className="space-y-2">
      {exercise.instructions && (
        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
          <p className="text-xs text-primary/80 mb-1 font-medium">Instruções</p>
          <RichTextRenderer content={exercise.instructions} className="text-foreground" />
        </div>
      )}
      {exercise.description && exercise.description !== exercise.instructions && (
        <div className="bg-surface/30 rounded-lg p-3 border border-border/20">
          <p className="text-xs text-muted-foreground mb-1">Descrição Técnica</p>
          <p className="text-sm text-foreground">{exercise.description}</p>
        </div>
      )}
    </div>
  );
};

// Componente para botão de vídeo que só aparece se houver vídeo
const VideoButton = ({
  exerciseName,
  onPlay
}: {
  exerciseName: string;
  onPlay: (e: React.MouseEvent) => void;
}) => {
  const { exercise, loading, videoUrl } = useExerciseVideo(exerciseName);

  // Só mostra botão se houver vídeo disponível
  if (loading || (!videoUrl && !exercise?.video_url)) {
    return null;
  }

  return (
    <button
      onClick={onPlay}
      className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-all active:scale-95"
      aria-label="Ver vídeo do exercício"
    >
      <Play className="w-4 h-4 text-primary ml-0.5" />
    </button>
  );
};

export const WorkoutDetail = ({ workout, onBack, onStartWorkout, onExerciseSelect }: WorkoutDetailProps) => {
  const navigate = useNavigate();
  const [videoModalExercise, setVideoModalExercise] = useState<Exercise | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento inicial
    setTimeout(() => setIsLoading(false), 400);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    navigate(`/${tab === 'home' ? '' : tab}`);
  }, [navigate]);

  const handlePlayClick = useCallback((e: React.MouseEvent, exercise: Exercise) => {
    e.stopPropagation();
    setVideoModalExercise(exercise);
  }, []);

  const handleExpandClick = useCallback((exercise: Exercise) => {
    setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id);
  }, [expandedExercise]);

  const handleStartWorkout = useCallback(async () => {
    // Feedback háptico no mobile
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        // Ignorar erro de haptic em dispositivos sem suporte
      }
    }
    onStartWorkout();
  }, [onStartWorkout]);

  // BUILD 18: Parse exercise values safely to prevent display bugs like "212 séries"
  const parseSetsValue = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 3 : Math.min(parsed, 20); // Cap at 20 for sanity
    }
    return 3;
  };

  const parseRepsValue = (val: any): string => {
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') {
      // Check if it's already a range like "10-12"
      if (val.includes('-')) return val;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? '12' : String(parsed);
    }
    return '12';
  };

  // Calcular calorias estimadas
  const estimateCalories = () => {
    const totalExercises = workout.exercises.length;
    const avgSets = 3;
    const estimatedMinutes = totalExercises * avgSets * 2; // ~2 min por série
    const MET = workout.difficulty === 'Avançado' ? 7.0 : workout.difficulty === 'Intermediário' ? 5.0 : 3.5;
    return Math.round((MET * 70 * estimatedMinutes) / 60);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-muted rounded-2xl"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-muted/50 rounded-2xl p-4">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background workout-page">{/* BUILD 25: workout-page remove quadrados */}
      {/* Fixed Header - Clean design, no harsh gradients */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 pt-safe">
        {/* Navigation Row */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            style={{ pointerEvents: 'auto' }}
            className="w-10 h-10 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center hover:bg-card transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Title centered */}
          <div className="flex-1 mx-4 text-center">
            <h1 className="text-lg font-bold text-foreground leading-tight line-clamp-1">{workout.name}</h1>
            <p className="text-xs text-muted-foreground">{workout.type}</p>
          </div>

          <div className="w-10 h-10" /> {/* Spacer for balance */}
        </div>
      </div>

      {/* Content with top margin to account for fixed header */}
      <div className="pt-16">{/* BUILD 32: Reduced from pt-20 */}
        {/* Stats section - Ultra clean like Home BUILD 32 */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 gap-4">{/* Increased gap from 3 to 4 */}
            {/* Duração */}
            <div className="flex items-center gap-3 px-2 py-2">
              <Clock className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground leading-tight">{workout.duration} min</p>
                <p className="text-xs text-muted-foreground">Duração</p>
              </div>
            </div>

            {/* Exercícios */}
            <div className="flex items-center gap-3 px-2 py-2">
              <Dumbbell className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground leading-tight">{workout.exercises.length}</p>
                <p className="text-xs text-muted-foreground">Exercícios</p>
              </div>
            </div>

            {/* Dificuldade */}
            <div className="flex items-center gap-3 px-2 py-2">
              <Flame className="w-6 h-6 text-orange-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground leading-tight">{workout.difficulty}</p>
                <p className="text-xs text-muted-foreground">Dificuldade</p>
              </div>
            </div>

            {/* Calorias */}
            <div className="flex items-center gap-3 px-2 py-2">
              <Zap className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground leading-tight">~{estimateCalories()}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exercises list */}
        <div className="px-4 pt-2 pb-40">
          <h2 className="text-xl font-bold text-foreground mb-4">Exercícios</h2>

          <div className="space-y-3">
            {workout.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-card/20 rounded-2xl p-4 transition-all duration-300"
              >
                {/* Header sempre visível */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <ExerciseNameDisplay exerciseName={exercise.name} />
                    <p className="text-muted-foreground text-sm font-medium mt-1">{exercise.type}</p>

                    {/* Informações formatadas */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {exercise.sets && exercise.reps && (
                        <span className="inline-flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-full text-xs">
                          <span className="font-semibold text-foreground">{parseSetsValue(exercise.sets)}</span>
                          <span className="text-muted-foreground">séries</span>
                          <span className="text-muted-foreground">×</span>
                          <span className="font-semibold text-foreground">{parseRepsValue(exercise.reps)}</span>
                          <span className="text-muted-foreground">reps</span>
                        </span>
                      )}
                      {exercise.rest && (
                        <span className="inline-flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-full text-xs">
                          <Timer className="w-3 h-3 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{exercise.rest}</span>
                          <span className="text-muted-foreground">descanso</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botões de ação compactos */}
                  <div className="flex items-center gap-2">
                    <VideoButton
                      exerciseName={exercise.name}
                      onPlay={(e) => handlePlayClick(e, exercise)}
                    />
                    <button
                      onClick={() => handleExpandClick(exercise)}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all active:scale-95"
                      aria-label="Ver descrição do exercício"
                    >
                      {expandedExercise === exercise.id ? 'Ocultar' : 'Ver descrição'}
                    </button>
                  </div>
                </div>

                {/* Detalhes expandíveis com animação */}
                {expandedExercise === exercise.id && (
                  <div className="mt-3 pt-3 border-t border-border/20 animate-in slide-in-from-top-2 duration-300">
                    <ExerciseInfoDisplay exerciseName={exercise.name} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start workout button - próximo à navbar */}
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-28 bg-gradient-to-t from-background/95 via-background/60 to-transparent z-[9999]">
          <button
            onClick={handleStartWorkout}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar Treino
          </button>
        </div>

        {/* Modal de vídeo fullscreen */}
        {videoModalExercise && (
          <div
            className="fixed inset-0 bg-black/95 z-[60] flex flex-col animate-fade-in"
            onClick={() => setVideoModalExercise(null)}
          >
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm pt-safe">
              <h3 className="text-white font-semibold text-lg truncate flex-1">
                {videoModalExercise.name}
              </h3>
              <button
                onClick={() => setVideoModalExercise(null)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors ml-4"
                aria-label="Fechar vídeo"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <div className="w-full max-w-2xl animate-scale-in">
                <VideoPlayer exerciseName={videoModalExercise.name} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};