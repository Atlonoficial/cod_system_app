import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, MoreVertical, Flag, Activity, Play, ChevronUp, Clock, Zap, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VideoPlayer } from "./VideoPlayer";
import { AGTTimer } from "@/components/workout/AGTTimer";
import { SetLogger } from "@/components/workout/SetLogger";
import { PostWorkoutCheckout, CheckoutData } from "@/components/workout/PostWorkoutCheckout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useWellnessCheckin } from "@/hooks/useWellnessCheckin";
import "@/components/workout/AGTTimer.css";
import "@/components/workout/SetLogger.css";

interface Exercise {
    id: number;
    name: string;
    type: string;
    sets?: string;
    reps?: string;
    duration?: string;
    rest: string;
    description: string;
    video_url?: string;
}

interface SetLog {
    setNumber: number;
    reps: number;
    weight: number;
    rpe: number;
}

interface WorkoutSessionCODProps {
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

export const WorkoutSessionCOD = ({ workout, onFinish, onExit }: WorkoutSessionCODProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const haptics = useHapticFeedback();

    // COD System - Wellness/Readiness
    const { readinessLevel, modifiers, readinessMessage } = useWellnessCheckin();

    // Session state
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(true);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSetNumber, setCurrentSetNumber] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    // COD System states
    const [showTimer, setShowTimer] = useState(false);
    const [showSetLogger, setShowSetLogger] = useState(true);
    const [showCheckout, setShowCheckout] = useState(false);
    const [exerciseLogs, setExerciseLogs] = useState<Map<number, SetLog[]>>(new Map());
    const [totalVolume, setTotalVolume] = useState(0);
    const [isVideoCollapsed, setIsVideoCollapsed] = useState(true);

    // Current exercise with adaptations
    const currentExercise = workout.exercises[currentExerciseIndex];

    // Parse sets/reps/rest safely with fallbacks
    const parseSetsValue = (val: any): number => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? 3 : parsed;
        }
        return 3;
    };

    const parseRepsValue = (val: any): number => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? 10 : parsed;
        }
        return 10;
    };

    const parseRestValue = (val: any): number => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? 60 : parsed;
        }
        return 60;
    };

    const baseSets = parseSetsValue(currentExercise?.sets);
    const baseReps = parseRepsValue(currentExercise?.reps);
    const baseRest = parseRestValue(currentExercise?.rest);

    const adaptedSets = Math.max(1, Math.round(baseSets * (modifiers?.volume || 1)));
    const adaptedReps = Math.max(1, Math.round(baseReps * (modifiers?.intensity || 1)));
    const adaptedRest = Math.max(30, Math.round(baseRest * (modifiers?.rest || 1)));

    // Timer for workout duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && !showTimer) {
            interval = setInterval(() => {
                setTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, showTimer]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getReadinessColor = () => {
        switch (readinessLevel) {
            case 'green': return 'from-green-500/20 to-green-600/10';
            case 'yellow': return 'from-amber-500/20 to-orange-500/10'; // Amber/Orange for moderate
            case 'red': return 'from-red-500/20 to-red-600/10';
            default: return 'from-primary/20 to-secondary/10';
        }
    };

    const handleSetComplete = async (reps: number, weight: number, rpe: number) => {
        await haptics.medium();

        // Save set log
        const currentLogs = exerciseLogs.get(currentExerciseIndex) || [];
        const newLog: SetLog = {
            setNumber: currentSetNumber,
            reps,
            weight,
            rpe
        };

        setExerciseLogs(prev => {
            const newMap = new Map(prev);
            newMap.set(currentExerciseIndex, [...currentLogs, newLog]);
            return newMap;
        });

        // Update total volume
        setTotalVolume(prev => prev + (reps * weight));

        toast.success(`Série ${currentSetNumber} registrada! ${reps}×${weight}kg RPE:${rpe}`);

        // Check if all sets done
        if (currentSetNumber >= adaptedSets) {
            // Exercise complete - show timer for transition
            await haptics.success();
            toast.success('🎉 Exercício concluído!');
            setShowSetLogger(false);
            setShowTimer(true);
        } else {
            // More sets to go - show rest timer
            setCurrentSetNumber(prev => prev + 1);
            setShowSetLogger(false);
            setShowTimer(true);
        }
    };

    const handleTimerComplete = async () => {
        await haptics.light();
        setShowTimer(false);

        // Check completed sets from logs (more reliable than currentSetNumber)
        const completedSetsForExercise = exerciseLogs.get(currentExerciseIndex)?.length || 0;
        const isExerciseComplete = completedSetsForExercise >= adaptedSets;

        if (isExerciseComplete) {
            if (currentExerciseIndex < workout.exercises.length - 1) {
                // Move to next exercise
                setCurrentExerciseIndex(prev => prev + 1);
                setCurrentSetNumber(1);
                setShowSetLogger(true);
            } else {
                // All exercises complete - show checkout
                handleFinish();
                return;
            }
        } else {
            // More sets to go for current exercise
            setShowSetLogger(true);
        }
    };

    const handleNextExercise = async () => {
        await haptics.medium();
        if (currentExerciseIndex < workout.exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
            setCurrentSetNumber(1);
            setShowSetLogger(true);
            setShowTimer(false);
        } else {
            handleFinish();
        }
    };

    const handleFinish = async () => {
        setIsRunning(false);
        // Show checkout modal instead of saving directly
        setShowCheckout(true);
    };

    const handleCheckoutComplete = async (checkoutData: CheckoutData) => {
        setShowCheckout(false);
        setIsSaving(true);

        try {
            await haptics.success();
            await saveWorkoutSession(checkoutData);
            toast.success('Treino finalizado com sucesso! 🎉');
            onFinish();
        } catch (error) {
            console.error('Error finishing workout:', error);
            toast.error('Erro ao salvar treino');
        } finally {
            setIsSaving(false);
        }
    };

    const saveWorkoutSession = async (checkout?: CheckoutData) => {
        if (!user?.id) return;

        try {
            // Calculate average RPE
            let totalRpe = 0;
            let rpeCount = 0;
            exerciseLogs.forEach(logs => {
                logs.forEach(log => {
                    totalRpe += log.rpe;
                    rpeCount++;
                });
            });
            const avgRpe = rpeCount > 0 ? totalRpe / rpeCount : 0;

            // Use checkout RPE if provided, otherwise use average
            const finalRpe = checkout?.overallRpe || Math.round(avgRpe);

            // Save to workout_logs (COD System)
            const { data: workoutLog, error: logError } = await supabase
                .from('workout_logs')
                .insert({
                    student_id: user.id,
                    workout_plan_id: workout.id.toString(),
                    session_name: workout.name,
                    status: 'completed',
                    readiness_level: readinessLevel || 'green',
                    volume_modifier: modifiers?.volume || 1,
                    intensity_modifier: modifiers?.intensity || 1,
                    rest_modifier: modifiers?.rest || 1,
                    started_at: new Date(Date.now() - time * 1000).toISOString(),
                    completed_at: new Date().toISOString(),
                    duration_seconds: time,
                    total_exercises: workout.exercises.length,
                    completed_exercises: currentExerciseIndex + 1,
                    total_volume_kg: totalVolume,
                    average_rpe: avgRpe,
                    overall_rpe: finalRpe,
                    workout_date: new Date().toISOString().split('T')[0],
                    // New checkout fields
                    workout_feeling: checkout?.workoutFeeling,
                    workout_notes: checkout?.notes
                })
                .select()
                .single();

            if (logError) {
                console.error('[COD] Error saving workout log:', logError);
            } else if (workoutLog) {
                // Save exercise logs
                const exerciseLogsToInsert = [];
                exerciseLogs.forEach((logs, exerciseIdx) => {
                    const exercise = workout.exercises[exerciseIdx];
                    if (!exercise) return;

                    exerciseLogsToInsert.push({
                        workout_log_id: workoutLog.id,
                        exercise_id: exercise.id.toString(),
                        exercise_name: exercise.name,
                        exercise_order: exerciseIdx,
                        prescribed_sets: parseInt(exercise.sets || '0'),
                        prescribed_reps: parseInt(exercise.reps || '0'),
                        prescribed_rest_seconds: parseInt(exercise.rest || '60'),
                        adapted_sets: adaptedSets,
                        adapted_reps: adaptedReps,
                        adapted_rest_seconds: adaptedRest,
                        actual_sets: logs.length,
                        actual_reps: logs.map(l => l.reps),
                        actual_weights: logs.map(l => l.weight),
                        rpe_per_set: logs.map(l => l.rpe),
                        average_rpe: logs.reduce((sum, l) => sum + l.rpe, 0) / logs.length,
                        status: 'completed',
                        total_volume_kg: logs.reduce((sum, l) => sum + (l.reps * l.weight), 0)
                    });
                });

                if (exerciseLogsToInsert.length > 0) {
                    await supabase.from('exercise_logs').insert(exerciseLogsToInsert);
                }
            }

            // Also save to legacy workout_sessions table for compatibility
            await supabase.from('workout_sessions').insert({
                user_id: user.id,
                workout_id: null,
                notes: `COD: ${workout.name} | Vol: ${totalVolume}kg | RPE: ${avgRpe.toFixed(1)}`,
                start_time: new Date(Date.now() - time * 1000).toISOString(),
                end_time: new Date().toISOString(),
                total_duration: Math.floor(time / 60)
            });

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['workout-history'] });
            queryClient.invalidateQueries({ queryKey: ['wellness-checkin'] });
        } catch (error) {
            console.error('Error saving workout session:', error);
            throw error;
        }
    };

    const completedSetsCount = exerciseLogs.get(currentExerciseIndex)?.length || 0;
    // Display the actual completed sets, capped at adaptedSets
    const displaySetsCount = Math.min(completedSetsCount, adaptedSets);
    // Clamp progress to max 100%
    const progressPercent = Math.min(
        100,
        ((currentExerciseIndex + displaySetsCount / adaptedSets) / workout.exercises.length) * 100
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Fixed Header - stays at top while scrolling */}
            <div className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-br ${getReadinessColor()} p-4 pt-safe border-b border-white/10 backdrop-blur-lg`}>
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={onExit}
                        className="w-10 h-10 rounded-2xl bg-background/20 backdrop-blur-sm flex items-center justify-center active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>

                    <div className="flex-1 mx-4 text-center">
                        <h1 className="text-sm font-semibold text-foreground truncate">{workout.name}</h1>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <span className="tabular-nums font-bold text-lg text-primary">{formatTime(time)}</span>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-10 h-10 rounded-2xl bg-background/20 backdrop-blur-sm flex items-center justify-center">
                                <MoreVertical className="w-5 h-5 text-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={handleFinish}
                                disabled={isSaving}
                                className="text-destructive focus:text-destructive"
                            >
                                <Flag className="w-4 h-4 mr-2" />
                                {isSaving ? 'Salvando...' : 'Finalizar Treino'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Readiness Badge */}
                {readinessLevel && readinessLevel !== 'green' && (
                    <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500/10 rounded-xl text-sm border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="font-medium text-amber-100">{readinessMessage}</span>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mt-3">
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                        <span>Exercício {currentExerciseIndex + 1}/{workout.exercises.length}</span>
                        <span className="font-medium">{Math.round(progressPercent)}% completo</span>
                    </div>
                </div>

                {/* Stats Cards - Part of fixed header */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-accent/20 rounded-xl p-2.5 text-center border border-accent/10">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Target className="w-3 h-3 text-accent" />
                            <p className="text-[10px] text-muted-foreground">Séries</p>
                        </div>
                        <p className="text-lg font-bold">{displaySetsCount}/{adaptedSets}</p>
                    </div>
                    <div className="bg-primary/20 rounded-xl p-2.5 text-center border border-primary/10">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                            <TrendingUp className="w-3 h-3 text-primary" />
                            <p className="text-[10px] text-muted-foreground">Volume</p>
                        </div>
                        <p className="text-lg font-bold">{totalVolume.toLocaleString()}kg</p>
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-2.5 text-center border border-green-500/10">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Zap className="w-3 h-3 text-green-400" />
                            <p className="text-[10px] text-muted-foreground">RPE</p>
                        </div>
                        <p className="text-lg font-bold">
                            {exerciseLogs.size > 0
                                ? (Array.from(exerciseLogs.values()).flat().reduce((sum, l) => sum + l.rpe, 0) /
                                    Array.from(exerciseLogs.values()).flat().length || 0).toFixed(1)
                                : '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="pt-[280px] pb-32 px-4">
                {/* Current Exercise Info */}
                <Card className="mb-4 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
                    <CardContent className="p-4">
                        <h2 className="text-xl font-bold mb-1 text-foreground">{currentExercise?.name}</h2>
                        {currentExercise?.description && (
                            <p className="text-sm text-muted-foreground mb-3">{currentExercise?.description}</p>
                        )}

                        {/* Adapted Values Badge - mais legível */}
                        {readinessLevel !== 'green' && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl text-xs mb-3 border border-primary/20">
                                <Zap className="w-3.5 h-3.5 text-primary" />
                                <span className="font-medium">{adaptedSets} séries</span>
                                <span className="text-muted-foreground">×</span>
                                <span className="font-medium">{adaptedReps} reps</span>
                                <span className="mx-1 text-muted-foreground/50">•</span>
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{adaptedRest}s</span>
                            </div>
                        )}

                        {/* Video Player with better styled toggle button */}
                        {currentExercise?.video_url && (
                            <div className="mt-2">
                                <button
                                    onClick={() => setIsVideoCollapsed(!isVideoCollapsed)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 active:scale-[0.98] transition-all border border-primary/20"
                                >
                                    {isVideoCollapsed ? (
                                        <>
                                            <Play className="w-4 h-4" />
                                            <span>Ver demonstração</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            <span>Ocultar vídeo</span>
                                        </>
                                    )}
                                </button>
                                {!isVideoCollapsed && (
                                    <div className="mt-3">
                                        <VideoPlayer
                                            exerciseName={currentExercise?.name || ''}
                                            videoUrl={currentExercise?.video_url}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Set Logger or Timer */}
                {showSetLogger && currentExercise && (
                    <SetLogger
                        setNumber={currentSetNumber}
                        totalSets={adaptedSets}
                        targetReps={adaptedReps}
                        previousWeight={
                            exerciseLogs.get(currentExerciseIndex)?.[currentSetNumber - 2]?.weight || 0
                        }
                        onComplete={handleSetComplete}
                    />
                )}

                {showTimer && (
                    <div className="bg-white/5 rounded-2xl p-4">
                        <h3 className="text-center text-muted-foreground mb-4">
                            {currentSetNumber > adaptedSets ? 'Próximo exercício em...' : `Descanso - Série ${currentSetNumber}`}
                        </h3>
                        <AGTTimer
                            restSeconds={adaptedRest}
                            onComplete={handleTimerComplete}
                            autoStart={true}
                            showSkip={true}
                        />
                    </div>
                )}

                {/* Quick Skip Button */}
                {!showTimer && (
                    <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={handleNextExercise}
                    >
                        Pular para próximo exercício
                    </Button>
                )}
            </div>

            {/* Post-Workout Checkout Modal */}
            <PostWorkoutCheckout
                isOpen={showCheckout}
                onComplete={handleCheckoutComplete}
                isSaving={isSaving}
                workoutStats={{
                    duration: time,
                    totalVolume: totalVolume,
                    averageRpe: exerciseLogs.size > 0
                        ? Array.from(exerciseLogs.values()).flat().reduce((sum, l) => sum + l.rpe, 0) /
                        Array.from(exerciseLogs.values()).flat().length || 0
                        : 0,
                    exercisesCompleted: currentExerciseIndex + 1,
                    totalExercises: workout.exercises.length
                }}
            />
        </div>
    );
};

export default WorkoutSessionCOD;


