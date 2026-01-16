import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Clock, Flame, Dumbbell, Play, ChevronDown, CheckCircle2, X, Zap, Timer, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  notes?: string;
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
      {/* Fixed Header - Transparent, no second background */}
      {/* BUILD 48: Fixed header with increased spacing to prevent overlap with cards */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-safe bg-background/80 backdrop-blur-sm">
        {/* Navigation Row */}
        <div className="flex items-center justify-between px-4 py-4 gap-3">
          <button
            onClick={onBack}
            style={{ pointerEvents: 'auto' }}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-card/30 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Title centered */}
          <div className="flex-1 mx-3 text-center min-w-0">
            <h1 className="text-lg font-bold text-foreground leading-tight line-clamp-1">{workout.name}</h1>
            <p className="text-xs text-muted-foreground">{workout.type}</p>
          </div>

          <div className="w-10 h-10" /> {/* Spacer for balance */}
        </div>
      </div>

      {/* Content with top margin to account for fixed header - BUILD 49: Increased to pt-32 */}
      <div className="pt-32">
        {/* Stats section - Ultra clean like Home BUILD 32 */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 gap-4">{/* Professional grid layout */}
            {/* Duração */}
            <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/20">
              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground leading-tight">{workout.duration} min</p>
                <p className="text-xs text-muted-foreground">Duração</p>
              </div>
            </div>

            {/* Exercícios */}
            <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/20">
              <Dumbbell className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground leading-tight">{workout.exercises.length}</p>
                <p className="text-xs text-muted-foreground">Exercícios</p>
              </div>
            </div>

            {/* Dificuldade */}
            <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/20">
              <Flame className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground leading-tight">{workout.difficulty}</p>
                <p className="text-xs text-muted-foreground">Dificuldade</p>
              </div>
            </div>

            {/* Calorias */}
            <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/20">
              <Zap className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground leading-tight">~{estimateCalories()}</p>
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
                className="rounded-2xl p-4 transition-all duration-300"
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
                    {/* BUILD 48: Improved button contrast with white text */}
                    <button
                      onClick={() => handleExpandClick(exercise)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                      aria-label="Ver descrição do exercício"
                    >
                      {expandedExercise === exercise.id ? 'Ocultar' : 'Ver descrição'}
                    </button>
                  </div>
                </div>

                {/* Detalhes expandíveis com animação - BUILD 50: Descrição e orientações */}
                {expandedExercise === exercise.id && (
                  <div className="mt-4 pt-4 border-t border-border/20 animate-in slide-in-from-top-2 duration-300 space-y-4">
                    {/* Descrição do exercício */}
                    {exercise.description && !/^\d+$/.test(exercise.description.trim()) && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground">Descrição</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                          {exercise.description}
                        </p>
                      </div>
                    )}

                    {/* Orientações do admin */}
                    {exercise.notes && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-amber-400" />
                          <h4 className="text-sm font-semibold text-foreground">Orientações</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-6">
                          {exercise.notes}
                        </p>
                      </div>
                    )}

                    {/* Vídeo demonstrativo */}
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

        {/* Modal de vídeo bottom sheet - BUILD 56 */}
        <Sheet open={!!videoModalExercise} onOpenChange={(open) => !open && setVideoModalExercise(null)}>
          <SheetContent
            side="bottom"
            className="h-[70vh] rounded-t-3xl p-0 bg-background border-t border-border/50"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <SheetHeader className="px-4 pb-3 border-b border-border/30">
              <SheetTitle className="text-base font-semibold text-foreground line-clamp-2 text-left">
                {videoModalExercise?.name}
              </SheetTitle>
            </SheetHeader>

            {/* Content scrollável */}
            <div className="overflow-y-auto h-[calc(70vh-80px)] px-4 py-4">
              <div className="w-full animate-scale-in">
                <VideoPlayer
                  exerciseName={videoModalExercise?.name || ''}
                  className="w-full aspect-video rounded-xl overflow-hidden"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};