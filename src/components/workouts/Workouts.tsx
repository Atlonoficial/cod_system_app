import { useState, useCallback } from "react";
import { Search, Filter, Loader2, ArrowLeft, ShieldAlert, ChevronDown, ChevronRight, FolderOpen, Target, Clock, CalendarDays } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useStudentMesocycles, type StudentMesocycle, type StudentMicrocycle } from "@/hooks/useStudentMesocycles";
import { useAuth } from "@/hooks/useAuth";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { useWellnessCheckin } from "@/hooks/useWellnessCheckin";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { WorkoutCard } from "./WorkoutCard";
import { WorkoutDetail } from "./WorkoutDetail";
import { ExerciseDetail } from "./ExerciseDetail";
import { WorkoutSessionCOD } from "./WorkoutSessionCOD";
import { WellnessCheckinModal } from "@/components/wellness/WellnessCheckinModal";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewState = 'list' | 'detail' | 'exercise' | 'session';

export const Workouts = () => {
  const { user } = useAuth();
  const { workouts, loading } = useWorkouts();
  // Mesocycle hierarchy support
  const { mesocycles, currentMesocycle, loading: loadingMesocycles } = useStudentMesocycles();
  const { isExpired, loading: subLoading } = useActiveSubscription();
  const { isCompletedToday } = useWorkoutHistory();
  const { light: hapticLight, success: hapticSuccess, error: hapticError } = useHapticFeedback();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewState>('list');
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  // Expanded mesocycle sections
  const [expandedMesocycles, setExpandedMesocycles] = useState<Set<string>>(new Set());

  // COD System - Check if wellness check-in is needed (moved to top to follow React hooks rules)
  const { needsCheckin, tableExists: codTablesExist } = useWellnessCheckin();
  const [showWellnessModal, setShowWellnessModal] = useState(false);

  // Muscle groups derived from workout data - extract from sessions and exercises
  const muscleGroups = ["Todos", ...Array.from(new Set(
    workouts.flatMap(w =>
      w.sessions.flatMap(s =>
        s.exercises.flatMap(e => e.muscle_groups || [])
      )
    )
  ))];

  // Get all muscle groups from a workout
  const getWorkoutMuscleGroups = (workout: any) => {
    const groups = workout.sessions?.flatMap((s: any) =>
      s.exercises?.flatMap((e: any) => e.muscle_groups || []) || []
    ) || [];
    return [...new Set(groups)];
  };

  // Estimate workout duration based on exercises
  const estimateWorkoutDuration = (workout: any) => {
    if (!workout.sessions || workout.sessions.length === 0) return 30;
    const firstSession = workout.sessions[0];
    if (!firstSession.exercises || firstSession.exercises.length === 0) return 30;

    // Rough estimate: 3 minutes per exercise on average
    return firstSession.exercises.length * 3;
  };

  // Estimate calories based on duration and difficulty
  const estimateCalories = (workout: any) => {
    const duration = estimateWorkoutDuration(workout);
    const baseCalories = duration * 8; // ~8 calories per minute base
    const multiplier = workout.difficulty === 'advanced' ? 1.3 :
      workout.difficulty === 'intermediate' ? 1.1 : 1.0;
    return Math.round(baseCalories * multiplier);
  };

  const handleWorkoutSelect = useCallback((workout: any) => {
    // Logic moved to Blocking Modal - REMOVED for App Store Compliance
    // if (isExpired) return;

    hapticLight();
    const mapped = mapWorkout(workout);
    setSelectedWorkout(mapped);
    setSelectedExercise(null);
    setCurrentView('detail');
  }, [hapticLight, hapticError]);

  const handleExerciseSelect = useCallback((exercise: any) => {
    setSelectedExercise(exercise);
    setCurrentView('exercise');
  }, []);

  const handleStartWorkout = useCallback(() => {
    setCurrentView('session');
  }, []);

  // Helpers to map Supabase workout to UI shape
  const difficultyPt = (d?: string) => d === 'beginner' ? 'Iniciante' : d === 'intermediate' ? 'Intermediário' : d === 'advanced' ? 'Avançado' : 'Geral';
  const mapExercises = (exs: any[] = []) => exs.map((ex: any, idx: number) => {
    const type = ex.type || ex.category || 'Força';
    const fallbackName = `Exercício #${idx + 1} (${type})`;

    return {
      id: idx + 1,
      name: ex.name || ex.exercise || ex.exerciseName || fallbackName,
      type: type,
      sets: ex.sets || 3,
      reps: ex.reps || '12',
      rest: ex.rest_seconds || ex.rest_time || '60',
      load: ex.load_kg || ex.weight || 0,
      load_unit: ex.load_unit || 'kg',           // NOVO: Unidade de carga
      cycles: ex.cycles,                          // NOVO: Ciclos
      tempo_cadence: ex.tempo_cadence,            // NOVO: Cadência
      duration: ex.duration,                      // Duração (para exercícios por tempo)
      video_url: ex.video_url, // Consistent with other components
      instructions: ex.notes || ex.instructions,
      description: ex.description || ex.instructions || '',
      muscle_groups: ex.muscle_groups || [],
      rest_seconds: ex.rest_seconds || ex.rest_time || 60
    };
  });

  const mapWorkout = (w: any) => ({
    id: w.id,
    name: w.name,
    type: getWorkoutMuscleGroups(w).join(', ') || 'Geral',
    duration: estimateWorkoutDuration(w),
    difficulty: difficultyPt(w.difficulty),
    exercises: w.sessions?.[0]?.exercises ? mapExercises(w.sessions[0].exercises) : [],
    image: w.image_url
  });

  const handleFinishWorkout = useCallback(() => {
    hapticSuccess();
    const points = Math.floor(Math.random() * 50) + 50;
    const achievements = [
      "🔥 Queimador de Calorias!",
      "💪 Força Total!",
      "⚡ Super Atleta!",
      "🏆 Campeão do Dia!",
      "🎯 Meta Atingida!"
    ];
    const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];

    toast({
      title: `${randomAchievement}`,
      description: `Parabéns! Você ganhou ${points} pontos e completou mais um treino! 🎉`,
    });

    setTimeout(() => {
      toast({
        title: "🚀 Continue assim!",
        description: "Você está cada vez mais forte! Próximo treino em 24h.",
      });
    }, 3000);

    setCurrentView('list');
    setSelectedWorkout(null);
    setSelectedExercise(null);
  }, []);

  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setSelectedWorkout(null);
    setSelectedExercise(null);
  }, []);

  const handleBackToDetail = useCallback(() => {
    setCurrentView('detail');
    setSelectedExercise(null);
  }, []);

  // Intercept workout start if check-in needed (only if COD System is active)
  const handleCODStartWorkout = useCallback(() => {
    if (codTablesExist && needsCheckin) {
      setShowWellnessModal(true);
    } else {
      setCurrentView('session');
    }
  }, [needsCheckin, codTablesExist]);

  // Toggle mesocycle expansion
  const toggleMesocycle = useCallback((mesocycleId: string) => {
    hapticLight();
    setExpandedMesocycles(prev => {
      const next = new Set(prev);
      if (next.has(mesocycleId)) {
        next.delete(mesocycleId);
      } else {
        next.add(mesocycleId);
      }
      return next;
    });
  }, [hapticLight]);

  // Map microcycle (from mesocycle structure) to workout format
  const mapMicrocycleToWorkout = useCallback((microcycle: StudentMicrocycle) => {
    const exercises = Array.isArray(microcycle.exercises) ? microcycle.exercises : [];

    return {
      id: microcycle.id,
      name: microcycle.name,
      description: microcycle.description,
      session_name: microcycle.session_name,
      difficulty: microcycle.difficulty || 'intermediate',
      sessions: [{
        id: microcycle.id,
        name: microcycle.session_name || 'Treino',
        exercises: exercises
      }]
    };
  }, []);

  // Select microcycle from mesocycle hierarchy
  const handleMicrocycleSelect = useCallback((microcycle: StudentMicrocycle) => {
    hapticLight();
    const mappedWorkout = mapMicrocycleToWorkout(microcycle);
    const mapped = mapWorkout(mappedWorkout);
    setSelectedWorkout(mapped);
    setSelectedExercise(null);
    setCurrentView('detail');
  }, [hapticLight, mapMicrocycleToWorkout]);

  // Determine if we have mesocycle data
  const hasMesocycles = mesocycles && mesocycles.length > 0;

  if (loading || loadingMesocycles) {
    return (
      <div className="p-4 pt-8 pb-safe-4xl flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando seus treinos...</p>
        </div>
      </div>
    );
  }



  // Renderização condicional baseada no estado atual
  if (currentView === 'session' && selectedWorkout) {
    return (
      <WorkoutSessionCOD
        workout={selectedWorkout}
        onFinish={handleFinishWorkout}
        onExit={handleBackToList}
      />
    );
  }

  if (currentView === 'exercise' && selectedExercise && selectedWorkout) {
    return (
      <ExerciseDetail
        exercise={selectedExercise}
        workout={selectedWorkout}
        onBack={handleBackToDetail}
        onStartExercise={handleCODStartWorkout}
      />
    );
  }

  if (currentView === 'detail' && selectedWorkout) {
    return (
      <>
        <WorkoutDetail
          workout={selectedWorkout}
          onBack={handleBackToList}
          onStartWorkout={handleCODStartWorkout}
          onExerciseSelect={handleExerciseSelect}
        />
        {/* COD System - Wellness Check-in Modal */}
        <WellnessCheckinModal
          isOpen={showWellnessModal}
          onComplete={() => {
            setShowWellnessModal(false);
            setCurrentView('session');
          }}
        />
      </>
    );
  }

  // ✅ Verificar loading PRIMEIRO (antes de validar autenticação ou mostrar empty state)
  if (loading) {
    return (
      <div className="p-4 pt-8 pb-safe-4xl flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando seus treinos...</p>
        </div>
      </div>
    );
  }

  // ✅ Validar autenticação DEPOIS do loading
  if (!user?.id) {
    return (
      <div className="p-4 pt-8 pb-safe-4xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Erro de Autenticação</h2>
          <p className="text-muted-foreground">
            Usuário não autenticado. Por favor, faça login novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-8">
      {/* Header */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/?tab=home")} aria-label="Voltar para a Home">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a Home
        </Button>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Treinos</h1>
        <p className="text-muted-foreground">Escolha seu treino e vamos começar!</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            placeholder="Buscar treinos..."
            className="w-full pl-10 pr-4 py-3 bg-card/50 border border-border/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {muscleGroups.map((group) => (
            <button
              key={group}
              className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors ${group === "Todos"
                ? "bg-accent text-background"
                : "bg-card/50 text-muted-foreground hover:bg-card/70"
                }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Grid - Mesocycle Hierarchy or Flat List */}
      {hasMesocycles ? (
        /* Mesocycle Hierarchy View */
        <div className="space-y-4">
          {mesocycles.map((mesocycle) => {
            const isExpanded = expandedMesocycles.has(mesocycle.id);
            const workoutCount = mesocycle.microcycles?.length || 0;

            return (
              <div key={mesocycle.id} className="rounded-2xl overflow-hidden bg-card/30 border border-border/30">
                {/* Mesocycle Header */}
                <button
                  onClick={() => toggleMesocycle(mesocycle.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-card/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{mesocycle.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {mesocycle.goal && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {mesocycle.goal}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mesocycle.duration_weeks} sem
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {workoutCount} treino(s)
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {/* Expanded Microcycles (Workouts) */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {mesocycle.microcycles && mesocycle.microcycles.length > 0 ? (
                      mesocycle.microcycles.map((microcycle, index) => {
                        const exerciseCount = Array.isArray(microcycle.exercises) ? microcycle.exercises.length : 0;

                        return (
                          <div
                            key={microcycle.id}
                            onClick={() => handleMicrocycleSelect(microcycle)}
                            className="flex items-center gap-3 p-3 rounded-xl bg-card/50 hover:bg-card/80 cursor-pointer transition-colors border border-transparent hover:border-accent/30"
                          >
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {microcycle.session_name || microcycle.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {exerciseCount} exercício(s) • {microcycle.estimated_duration || 30} min
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Nenhum treino configurado neste mesociclo
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum treino disponível ainda.</p>
          <p className="text-sm text-muted-foreground mt-2">Aguarde seu professor atribuir treinos para você!</p>
        </div>
      ) : (
        /* Flat Workout List (Legacy/Fallback) */
        <div className="grid grid-cols-1 gap-4">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              name={workout.name}
              duration={estimateWorkoutDuration(workout)}
              difficulty={difficultyPt(workout.difficulty)}
              calories={estimateCalories(workout)}
              muscleGroup={getWorkoutMuscleGroups(workout).join(', ') || 'Geral'}
              isCompleted={isCompletedToday(workout.id)}
              onClick={() => handleWorkoutSelect(workout)}
            />
          ))}
        </div>
      )}
    </div>
  );
};