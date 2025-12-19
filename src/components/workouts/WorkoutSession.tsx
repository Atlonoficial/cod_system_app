import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Pause, Play, Timer, SkipForward, Target, CheckCircle2, Trophy, MoreVertical, Flame, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { VideoPlayer } from "./VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { toast } from "sonner";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface Exercise {
  id: number;
  name: string;
  type: string;
  sets?: string;
  reps?: string;
  duration?: string;
  rest: string;
  description: string;
}

interface WorkoutSessionProps {
  workout: {
    id: string | number;
    name: string;
    type: string;
    duration: number;
    exercises: Exercise[];
  };
  onFinish: () => void;
  onExit: () => void;
}

export const WorkoutSession = ({ workout, onFinish, onExit }: WorkoutSessionProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const haptics = useHapticFeedback();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<number, number>>({});
  const [currentSet, setCurrentSet] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Exit confirmation and completion modal states
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [workoutStats, setWorkoutStats] = useState({
    duration: 0,
    totalSets: 0,
    calories: 0
  });

  const DEFAULT_REST_TIME = 60; // 60 segundos padrão

  const handleTabChange = useCallback((tab: string) => {
    navigate(`/${tab === 'home' ? '' : tab}`);
  }, [navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        if (isResting && restTime > 0) {
          setRestTime(prev => prev - 1);
        } else if (isResting && restTime === 0) {
          setIsResting(false);
          setTime(prevTime => prevTime + 1);
        } else {
          setTime(prevTime => prevTime + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, isResting, restTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleRest = () => {
    setIsResting(true);
    setRestTime(DEFAULT_REST_TIME);
  };

  const handleNextExercise = async () => {
    await haptics.medium();
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      handleRest();
    } else {
      handleFinish();
    }
  };

  // Handle exit request - show confirmation popup
  const handleExitRequest = () => {
    setShowExitConfirm(true);
  };

  // Handle confirmed exit - discard progress
  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onExit();
  };

  // Calculate estimated calories
  const calculateCalories = () => {
    const totalSets = Object.values(completedSets).reduce((a, b) => a + b, 0);
    const minutes = Math.floor(time / 60);
    const MET = 5.0; // Average MET for strength training
    return Math.round((MET * 70 * minutes) / 60); // Assuming 70kg avg weight
  };

  const handleFinish = async () => {
    setIsRunning(false);
    setIsSaving(true);

    try {
      await haptics.success();

      // Calculate workout stats
      const totalSets = Object.values(completedSets).reduce((a, b) => a + b, 0);
      const calories = calculateCalories();

      setWorkoutStats({
        duration: time,
        totalSets: totalSets,
        calories: calories
      });

      // Save workout session
      await saveWorkoutSession();

      // Show completion modal
      setShowCompletionModal(true);

    } catch (error) {
      console.error('Error finishing workout:', error);
      toast.error('Erro ao salvar treino');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for closing completion modal
  const handleCloseCompletion = () => {
    setShowCompletionModal(false);
    onFinish();
  };



  const saveWorkoutSession = async () => {
    try {
      if (!user?.id) return;

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (time * 1000));

      // Validar workout_id antes de salvar
      if (!workout.id) {
        console.error('Invalid workout ID');
        toast.error('Erro: ID de treino inválido');
        return;
      }

      console.log('Saving workout session:', {
        user_id: user.id,
        workout_id: workout.id.toString(),
        duration: Math.floor(time / 60)
      });

      // Tenta salvar com o ID do treino (assumindo que existe na tabela workouts)
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert([{
          user_id: user.id,
          workout_id: workout.id.toString(),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_duration: Math.floor(time / 60)
        }]);

      if (error) {
        // Se falhar por FK (o ID é de um PLANO e não de um TREINO), tenta salvar sem o ID
        if (error.code === '23503') { // foreign_key_violation
          console.warn('FK Violation: Workout ID likely refers to a Plan. Retrying with null workout_id.');

          const { error: retryError } = await supabase
            .from('workout_sessions')
            .insert([{
              user_id: user.id,
              workout_id: null, // Deixa nulo para não quebrar a FK
              notes: `Treino realizado a partir do plano: ${workout.name} (ID: ${workout.id})`, // Salva referência no notes
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              total_duration: Math.floor(time / 60)
            }]);

          if (retryError) {
            console.error('Error saving workout session (retry):', retryError);
            // Não lança erro aqui para permitir que os pontos sejam dados
            toast.error('Erro ao salvar histórico do treino, mas seus pontos serão computados.');
          }
        } else {
          console.error('Error saving workout session:', error);
          toast.error('Erro ao salvar histórico do treino, mas seus pontos serão computados.');
        }
      }

      // Dar pontos manualmente - SEPARADO DO SALVAMENTO
      try {
        toast.success(`Treino concluído! 🎉`);
      } catch (pointError) {
        console.error('[WorkoutSession] Error awarding points:', pointError);
      }

      // Registrar atividade diária
      try {
        await supabase.rpc('register_daily_activity');
      } catch (e) {
        console.error('Error registering daily activity:', e);
      }

      // Invalidar queries para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['workout-history'] });

    } catch (error: any) {
      console.error('Error saving workout session:', error);
      toast.error(`Erro ao salvar treino: ${error.message || 'Erro de conexão'}`);
    } finally {
      setIsSaving(false);
    }
  };


  const currentExercise = workout.exercises[currentExerciseIndex];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header compacto com timer circular */}
      <div className="flex-shrink-0 bg-gradient-to-br from-secondary to-secondary/80 p-4 pt-safe">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleExitRequest}
            className="w-10 h-10 rounded-2xl bg-background/20 backdrop-blur-sm flex items-center justify-center hover:bg-background/30 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <h1 className="text-base font-semibold text-white truncate mx-4 flex-1 text-center line-clamp-2 leading-tight">
            {workout.name}
          </h1>

          {/* Menu de finalizar protegido */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-2xl bg-background/20 backdrop-blur-sm flex items-center justify-center hover:bg-background/30 transition-colors">
                <MoreVertical className="w-5 h-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleFinish}
                disabled={isSaving || Object.values(completedSets).reduce((a, b) => a + b, 0) === 0}
                className="text-destructive focus:text-destructive"
              >
                {isSaving ? 'Salvando...' : 'Finalizar Treino'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Timer circular compacto */}
        <div className="flex justify-center mb-2">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="56" cy="56" r="50"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-white/20"
              />
              <circle
                cx="56" cy="56" r="50"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-white transition-all duration-1000"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - ((currentExerciseIndex + 1) / workout.exercises.length))}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white tabular-nums">
                {isResting ? formatTime(restTime) : formatTime(time)}
              </div>
              <div className="text-xs text-white/80 font-medium mt-0.5">
                {isResting ? 'descanso' : 'treino'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats unificados */}
      <div className="grid grid-cols-3 gap-2.5 px-4 -mt-4 mb-4 relative z-10">
        <Card className="bg-accent/10 border-accent/20 backdrop-blur-sm">
          <CardContent className="p-2.5 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-tight">Exercício</p>
              <p className="text-sm font-bold leading-tight">{currentExerciseIndex + 1}/{workout.exercises.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/10 border-accent/20 backdrop-blur-sm">
          <CardContent className="p-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-tight">Séries</p>
              <p className="text-sm font-bold leading-tight">{Object.values(completedSets).reduce((a, b) => a + b, 0)}</p>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto pb-48 safe-area-bottom">
        {/* Exercício atual em destaque */}
        <div className="p-6">
          {/* Exercício atual com contraste melhorado */}
          <div className="bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 border-accent/30 rounded-3xl p-6 mb-6 shadow-lg border">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Exercício Atual</h2>
            <h3 className="text-2xl font-bold text-foreground mb-2 leading-tight">{currentExercise.name}</h3>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{currentExercise.description}</p>

            {/* Preview do próximo exercício */}
            {workout.exercises[currentExerciseIndex + 1] && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-4 bg-background/50 px-3 py-1.5 rounded-full w-fit">
                <span className="opacity-60">Próximo:</span>
                <span className="font-medium">{workout.exercises[currentExerciseIndex + 1].name}</span>
              </p>
            )}

            {/* Informações formatadas */}
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {currentExercise.sets && currentExercise.reps && (
                <div className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-2 rounded-full">
                  <span className="text-sm font-bold text-foreground">{currentExercise.sets}</span>
                  <span className="text-xs text-muted-foreground">séries</span>
                  <span className="text-muted-foreground">×</span>
                  <span className="text-sm font-bold text-foreground">{currentExercise.reps}</span>
                  <span className="text-xs text-muted-foreground">reps</span>
                </div>
              )}

              {currentExercise.rest && (
                <div className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-2 rounded-full">
                  <Timer className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">{currentExercise.rest}</span>
                  <span className="text-xs text-muted-foreground">descanso</span>
                </div>
              )}

              {currentExercise.duration && (
                <div className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-2 rounded-full">
                  <span className="text-sm font-bold text-foreground">{currentExercise.duration}</span>
                </div>
              )}
            </div>

            {/* Controle de Séries */}
            {currentExercise.sets && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center px-2">
                  <span className="text-foreground font-semibold text-sm">
                    Série {currentSet} de {currentExercise.sets}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {completedSets[currentExerciseIndex] || 0}/{currentExercise.sets} concluídas
                  </span>
                </div>

                {/* Bolinhas de séries tocáveis */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  {Array.from({ length: parseInt(currentExercise.sets) }).map((_, i) => {
                    const isCompleted = i < (completedSets[currentExerciseIndex] || 0);
                    return (
                      <button
                        key={i}
                        onClick={async () => {
                          const totalSets = parseInt(currentExercise.sets || '0');
                          if (i < (completedSets[currentExerciseIndex] || 0)) return; // Não desmarcar

                          await haptics.medium();
                          setCompletedSets(prev => ({
                            ...prev,
                            [currentExerciseIndex]: i + 1
                          }));
                          setCurrentSet(i + 2);

                          if (i + 1 === totalSets) {
                            await haptics.success();
                            toast.success('🎉 Todas as séries concluídas!');
                          } else {
                            toast.success(`Série ${i + 1} concluída!`);
                          }
                        }}
                        className={`w-4 h-4 rounded-full transition-all ${isCompleted
                          ? 'bg-primary scale-110'
                          : 'bg-muted/30 border border-muted hover:bg-muted/50'
                          }`}
                        aria-label={`Série ${i + 1}`}
                      />
                    );
                  })}
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    {completedSets[currentExerciseIndex] || 0}/{currentExercise.sets}
                  </span>
                </div>

                {/* Barra de progresso animada */}
                <div className="w-full bg-muted/20 rounded-full h-3 overflow-hidden mb-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 relative"
                    style={{
                      width: `${((completedSets[currentExerciseIndex] || 0) / parseInt(currentExercise.sets)) * 100}%`
                    }}
                  >
                    {(completedSets[currentExerciseIndex] || 0) === parseInt(currentExercise.sets) && (
                      <div className="absolute inset-0 bg-white/30 animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Botão de série concluída */}
                <button
                  onClick={async () => {
                    const totalSets = parseInt(currentExercise.sets || '0');
                    const currentCompleted = completedSets[currentExerciseIndex] || 0;

                    if (currentCompleted >= totalSets) return;

                    await haptics.medium();
                    const newCompleted = currentCompleted + 1;
                    setCompletedSets(prev => ({
                      ...prev,
                      [currentExerciseIndex]: newCompleted
                    }));
                    setCurrentSet(prev => Math.min(prev + 1, totalSets));

                    if (newCompleted === totalSets) {
                      await haptics.success();
                      toast.success('🎉 Todas as séries concluídas!');
                    } else {
                      toast.success(`Série ${newCompleted} concluída!`);
                    }
                  }}
                  disabled={(completedSets[currentExerciseIndex] || 0) >= parseInt(currentExercise.sets || '0')}
                  className="w-full py-4 bg-primary hover:bg-primary/90 rounded-2xl font-semibold text-primary-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {(completedSets[currentExerciseIndex] || 0) >= parseInt(currentExercise.sets || '0')
                    ? '✓ Exercício Completo'
                    : `Marcar Série ${(completedSets[currentExerciseIndex] || 0) + 1} Concluída`
                  }
                </button>
              </div>
            )}
          </div>

          {/* Lista de exercícios */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Próximos Exercícios</h2>

            <div className="space-y-3">
              {workout.exercises.map((exercise, index) => {
                const isCompleted = index < currentExerciseIndex;
                const isCurrent = index === currentExerciseIndex;
                const isPending = index > currentExerciseIndex;

                const setsCompleted = completedSets[index] || 0;
                const totalSets = exercise.sets ? parseInt(exercise.sets) : 0;

                return (
                  <Card
                    key={exercise.id}
                    className={`${isCurrent
                      ? 'bg-gradient-accent text-background border-accent shadow-lg scale-105'
                      : isCompleted
                        ? 'bg-success/20 text-foreground border-success'
                        : 'bg-card/50 border-border'
                      } rounded-2xl transition-all duration-300`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{exercise.name}</h3>
                          <p className="text-sm opacity-80 mb-1">{exercise.type}</p>

                          {exercise.sets && exercise.reps && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs opacity-70">
                                {exercise.sets} × {exercise.reps}
                              </p>
                              {isCurrent && totalSets > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 bg-background/20 rounded-full">
                                  {setsCompleted}/{totalSets}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ml-3 flex-shrink-0 ${isCurrent ? 'bg-background/20' :
                          isCompleted ? 'bg-success' :
                            'bg-muted/50'
                          }`}>
                          <span className="font-bold text-lg">
                            {isCompleted ? '✓' : isCurrent ? '▶' : index + 1}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Controles fixos com melhor visual e safe area */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Gradiente de proteção para legibilidade */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />

        <div className="relative px-6 pb-safe pt-4">
          {/* Barra de progresso compacta */}
          <div className="mb-6 px-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
              <span>Progresso do Treino</span>
              <span>{Math.round(((currentExerciseIndex + 1) / workout.exercises.length) * 100)}%</span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                style={{
                  width: `${((currentExerciseIndex + 1) / workout.exercises.length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Botões de controle ampliados */}
          <div className="flex items-end justify-center gap-6 mb-4">
            {/* Botão Pausar/Retomar */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handlePause}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg active:scale-95 ${isPaused
                  ? 'bg-success text-success-foreground hover:bg-success/90 hover:shadow-success/30'
                  : 'bg-muted/80 text-foreground backdrop-blur-md border border-white/10 hover:bg-muted'
                  }`}
              >
                {isPaused ? <Play className="w-6 h-6 ml-1" /> : <Pause className="w-6 h-6" />}
              </button>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {isPaused ? 'Retomar' : 'Pausar'}
              </span>
            </div>

            {/* Botão Descansar (Central/Destaque) */}
            <div className="flex flex-col items-center gap-2 -translate-y-2">
              <button
                onClick={handleRest}
                disabled={isResting}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:shadow-none"
              >
                <Timer className="w-9 h-9" />
              </button>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Descansar
              </span>
            </div>

            {/* Botão Próximo */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleNextExercise}
                className="w-14 h-14 rounded-full bg-muted/80 text-foreground backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-muted transition-all duration-300 shadow-lg active:scale-95"
              >
                <SkipForward className="w-6 h-6" />
              </button>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Próximo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Sair do Treino?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              <p>Se você sair agora:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>O treino <strong>NÃO será salvo</strong></li>
                <li>Você não receberá pontos</li>
                <li>Todo o progresso será perdido</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Continuar Treino
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExit}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sair Mesmo Assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Workout Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-4">
            {/* Trophy Icon */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-bounce">
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              🎉 Treino Concluído!
            </h2>
            <p className="text-muted-foreground mb-6">
              Parabéns! Você completou seu treino.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-muted/50 rounded-xl p-3">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">
                  {formatTime(workoutStats.duration)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Duração</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">
                  {workoutStats.totalSets}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Séries</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">
                  ~{workoutStats.calories}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">kcal</p>
              </div>
            </div>

            {/* Professor notification message */}
            <p className="text-xs text-muted-foreground mb-4 bg-primary/10 px-3 py-2 rounded-lg">
              ✅ Seu professor foi notificado sobre a conclusão do treino!
            </p>

            <Button
              onClick={handleCloseCompletion}
              className="w-full bg-gradient-to-r from-primary to-primary/80"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Ver Meu Progresso
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};