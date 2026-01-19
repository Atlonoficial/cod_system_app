import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ArrowLeft, MoreVertical, Flag, Activity, Play, ChevronUp, Clock, Zap, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExerciseVideoSheet } from "./ExerciseVideoSheet";
import { AGTTimer } from "@/components/workout/AGTTimer";
import { SetLogger } from "@/components/workout/SetLogger";
import { PostWorkoutCheckout, CheckoutData } from "@/components/workout/PostWorkoutCheckout";
import { ResumeWorkoutDialog } from "@/components/workout/ResumeWorkoutDialog";
import { useWorkoutSessionPersistence } from "@/hooks/useWorkoutSessionPersistence";
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
    instructions?: string;
    notes?: string;
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
    // Calculate total volume dynamically from logs
    const totalVolume = useMemo(() => {
        let volume = 0;
        exerciseLogs.forEach((logs) => {
            logs.forEach(log => {
                volume += log.reps * log.weight;
            });
        });
        return volume;
    }, [exerciseLogs]);
    const [isVideoCollapsed, setIsVideoCollapsed] = useState(true);

    // Persistence states
    const [showResumeDialog, setShowResumeDialog] = useState(false);
    const [sessionRestored, setSessionRestored] = useState(false);
    const [showEarlyFinishConfirm, setShowEarlyFinishConfirm] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Ref to track if we are in the finish flow to prevent auto-saves
    const isFinishFlow = useRef(false);
    const {
        savedSession,
        hasActiveSession,
        saveSession,
        clearSession,
        getSessionAge,
        isLoading: isLoadingSession
    } = useWorkoutSessionPersistence(user?.id);

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

    // Check for saved session on mount
    useEffect(() => {
        if (!isLoadingSession && hasActiveSession && savedSession && !sessionRestored) {
            // Check if it's the same workout
            if (savedSession.workoutId === workout.id) {
                setShowResumeDialog(true);
                setIsRunning(false); // Pause until user decides
            }
        }
    }, [isLoadingSession, hasActiveSession, savedSession, workout.id, sessionRestored]);

    // Restore session handler
    const handleResumeSession = useCallback(() => {
        if (!savedSession) return;

        // Restore state from saved session
        setTime(savedSession.elapsedTime);
        setCurrentExerciseIndex(savedSession.currentExerciseIndex);
        setCurrentSetNumber(savedSession.currentSetNumber);
        // Total volume is auto-calculated from restored logs

        // Restore exercise logs (convert object back to Map)
        const restoredLogs = new Map<number, SetLog[]>();
        Object.entries(savedSession.exerciseLogs || {}).forEach(([key, value]) => {
            restoredLogs.set(parseInt(key), value as SetLog[]);
        });
        setExerciseLogs(restoredLogs);

        setSessionRestored(true);
        setShowResumeDialog(false);
        setIsRunning(true);

        toast.success('Treino restaurado! Continuando de onde parou ??');
    }, [savedSession]);

    // Start new session handler  
    const handleStartNewSession = useCallback(async () => {
        await clearSession();
        setSessionRestored(true);
        setShowResumeDialog(false);
        setIsRunning(true);

        toast.info('Iniciando novo treino');
    }, [clearSession]);

    // Auto-save session after each set
    const autoSaveSession = useCallback(() => {
        if (!user?.id) return;

        // Convert Map to object for serialization
        const logsObject: Record<number, SetLog[]> = {};
        exerciseLogs.forEach((value, key) => {
            logsObject[key] = value;
        });

        saveSession({
            workoutId: workout.id,
            workoutName: workout.name,
            userId: user.id,
            currentExerciseIndex,
            currentSetNumber,
            exerciseLogs: logsObject,
            totalVolume,
            elapsedTime: time,
            startedAt: new Date(Date.now() - time * 1000).toISOString(),
            readinessLevel: readinessLevel || 'green',
            modifiers: modifiers || { volume: 1, intensity: 1, rest: 1 }
        });
    }, [user?.id, workout, currentExerciseIndex, currentSetNumber, exerciseLogs, totalVolume, time, readinessLevel, modifiers, saveSession]);

    // Refs to hold latest state for unmount saving
    const stateRef = useRef({
        exerciseLogs,
        time,
        currentExerciseIndex,
        currentSetNumber,
        totalVolume,
        readinessLevel,
        modifiers,
        user,
        workout,
        saveSession
    });

    // Update refs on every render
    useEffect(() => {
        stateRef.current = {
            exerciseLogs,
            time,
            currentExerciseIndex,
            currentSetNumber,
            totalVolume,
            readinessLevel,
            modifiers,
            user,
            workout,
            saveSession
        };
    }, [exerciseLogs, time, currentExerciseIndex, currentSetNumber, totalVolume, readinessLevel, modifiers, user, workout, saveSession]);

    // Save session ONLY when component unmounts (user leaves workout)
    useEffect(() => {
        return () => {
            const current = stateRef.current;
            const hasMadeProgress = current.exerciseLogs.size > 0 || current.time > 60;

            // Only save if:
            // 1. User has made progress
            // 2. We are NOT in the finish flow (prevents race condition with clearSession)
            if (hasMadeProgress && !isFinishFlow.current && current.user?.id) {
                // Manually trigger save with latest ref data
                const logsObject: Record<number, SetLog[]> = {};
                current.exerciseLogs.forEach((value, key) => {
                    logsObject[key] = value;
                });

                current.saveSession({
                    workoutId: current.workout.id,
                    workoutName: current.workout.name,
                    userId: current.user.id,
                    currentExerciseIndex: current.currentExerciseIndex,
                    currentSetNumber: current.currentSetNumber,
                    exerciseLogs: logsObject,
                    totalVolume: current.totalVolume,
                    elapsedTime: current.time,
                    startedAt: new Date(Date.now() - current.time * 1000).toISOString(),
                    readinessLevel: current.readinessLevel || 'green',
                    modifiers: current.modifiers || { volume: 1, intensity: 1, rest: 1 }
                });
            }
        };
    }, []);

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
        // Total volume auto-updates via useMemo

        toast.success(`Série ${currentSetNumber} registrada! ${reps}×${weight}kg RPE:${rpe}`);

        // Check if all sets done
        if (currentSetNumber >= adaptedSets) {
            // Exercise complete - show timer for transition
            await haptics.success();
            toast.success('?? Exercício concluído!');
            setShowSetLogger(false);
            setShowTimer(true);
        } else {
            // More sets to go - show rest timer
            setCurrentSetNumber(prev => prev + 1);
            setShowSetLogger(false);
            setShowTimer(true);
        }

        // Auto-save after each set
        setTimeout(() => autoSaveSession(), 500);
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

    // Handle finish request - shows confirmation if not complete
    const handleFinishRequest = async () => {
        const completed = currentExerciseIndex === workout.exercises.length - 1 &&
            (exerciseLogs.get(currentExerciseIndex)?.length || 0) >= adaptedSets;
        if (completed) {
            handleFinish();
        } else {
            setShowEarlyFinishConfirm(true);
        }
    };

    // Handle confirmed early finish
    const handleConfirmEarlyFinish = async () => {
        setShowEarlyFinishConfirm(false);
        handleFinish();
    };

    const handleFinish = async () => {
        isFinishFlow.current = true; // Mark as finishing to block auto-save
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

            // Clear persisted session after successful save
            await clearSession();

            toast.success('Treino finalizado com sucesso! ??');
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
            // Wrapped in try-catch as this table may have schema issues
            try {
                const { error: sessionError } = await supabase.from('workout_sessions').insert({
                    user_id: user.id,
                    workout_id: null,
                    notes: `COD: ${workout.name} | Vol: ${totalVolume}kg | RPE: ${avgRpe.toFixed(1)}`,
                    start_time: new Date(Date.now() - time * 1000).toISOString(),
                    end_time: new Date().toISOString(),
                    total_duration: Math.floor(time / 60)
                });

                if (sessionError) {
                    console.warn('[WorkoutSession] Legacy workout_sessions save failed (non-blocking):', sessionError.message);
                } else {
                    console.log('? [WorkoutSession] Saved to workout_sessions table successfully');
                }
            } catch (legacyError) {
                console.warn('[WorkoutSession] workout_sessions insert skipped:', legacyError);
            }

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
    // Check if workout is complete
    const isWorkoutComplete = currentExerciseIndex === workout.exercises.length - 1 && completedSetsCount >= adaptedSets;
    // Clamp progress to max 100%
    const progressPercent = Math.min(
        100,
        ((currentExerciseIndex + displaySetsCount / adaptedSets) / workout.exercises.length) * 100
    );

    return (
        <div className="min-h-screen bg-background workout-page">{/* BUILD 25: workout-page remove quadrados */}
            {/* Fixed Header - Transparent, no second background */}
            <div className="fixed top-0 left-0 right-0 z-50 pt-safe">
                {/* Top Navigation Row */}
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => setShowExitConfirm(true)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 hover:bg-card/30 transition-colors"
                        aria-label="Sair do treino"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>

                    <div className="flex-1 mx-4 text-center">
                        <h1 className="text-xs font-medium text-muted-foreground truncate">{workout.name}</h1>
                        <span className="tabular-nums font-bold text-2xl text-primary">{formatTime(time)}</span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-card/30 transition-colors"
                                aria-label="Menu de opções"
                            >
                                <MoreVertical className="w-5 h-5 text-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={handleFinishRequest}
                                disabled={isSaving}
                                className="text-destructive focus:text-destructive"
                            >
                                <Flag className="w-4 h-4 mr-2" />
                                {isSaving ? 'Salvando...' : 'Finalizar Treino'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Readiness Badge - More subtle - BUILD 48: Increased margin */}
                {readinessLevel && readinessLevel !== 'green' && (
                    <div className="mx-4 mb-6 flex items-center justify-center gap-2 py-2 px-4 bg-amber-500/10 rounded-xl text-sm border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="font-medium text-amber-300 text-xs">{readinessMessage}</span>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="px-4 pb-3">
                    <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                        <span>Exercício {currentExerciseIndex + 1}/{workout.exercises.length}</span>
                        <span className="font-medium text-primary">{Math.round(progressPercent)}%</span>
                    </div>
                </div>

                {/* Stats Cards - BUILD 52: Increased bottom padding for spacing */}
                <div className="grid grid-cols-3 gap-4 px-4 pb-6">
                    <div className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="w-4 h-4 text-primary" />
                            <p className="text-[10px] text-muted-foreground">Séries</p>
                        </div>
                        <p className="text-xl font-bold text-foreground">{displaySetsCount}/{adaptedSets}</p>
                    </div>
                    <div className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                            <p className="text-[10px] text-muted-foreground">Volume</p>
                        </div>
                        <p className="text-xl font-bold text-foreground">{totalVolume.toLocaleString()}kg</p>
                    </div>
                    <div className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Zap className="w-4 h-4 text-green-400" />
                            <p className="text-[10px] text-muted-foreground">RPE</p>
                        </div>
                        <p className="text-xl font-bold text-foreground">
                            {exerciseLogs.size > 0
                                ? (Array.from(exerciseLogs.values()).flat().reduce((sum, l) => sum + l.rpe, 0) /
                                    Array.from(exerciseLogs.values()).flat().length || 0).toFixed(1)
                                : '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area - BUILD 52: Further increased offset for better spacing */}
            <div className="pt-[310px] pb-32 px-4">
                {/* Current Exercise Info - BUILD 50: Professional layout with proper spacing */}
                <Card className="mb-4 border-border/20 bg-card/30 backdrop-blur-sm">
                    <CardContent className="p-6 pt-8">
                        {/* Exercise Title - BUILD 52: Increased spacing */}
                        <h2 className="text-lg font-bold mb-5 text-foreground line-clamp-2 leading-tight">
                            {currentExercise?.name}
                        </h2>

                        {/* Exercise Info - Compact badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full text-xs border border-primary/20">
                                <Zap className="w-3 h-3 text-primary" />
                                <span className="font-medium text-foreground">{adaptedSets}</span>
                                <span className="text-muted-foreground">séries</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-purple-500/10 px-2.5 py-1 rounded-full text-xs border border-purple-500/20">
                                <Target className="w-3 h-3 text-purple-400" />
                                <span className="font-medium text-foreground">{adaptedReps}</span>
                                <span className="text-muted-foreground">reps</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-full text-xs border border-green-500/20">
                                <Clock className="w-3 h-3 text-green-400" />
                                <span className="font-medium text-foreground">{adaptedRest}s</span>
                                <span className="text-muted-foreground">descanso</span>
                            </span>
                        </div>

                        {/* Description - Only show if it's not purely numeric */}
                        {currentExercise?.description && typeof currentExercise.description === 'string' && currentExercise.description.trim() !== '' && !/^\d+$/.test(currentExercise.description.trim()) && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                                {currentExercise?.description}
                            </p>
                        )}


                        {/* Adapted Values Badge - Only show if not green readiness */}
                        {readinessLevel !== 'green' && (
                            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-500/10 rounded-xl text-xs border border-amber-500/20">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-amber-300">Treino adaptado para sua condição atual</span>
                            </div>
                        )}

                        {/* Video Button - With description, instructions and notes */}
                        {currentExercise?.video_url && (
                            <div className="mt-2">
                                <ExerciseVideoSheet
                                    exerciseName={currentExercise.name}
                                    videoUrl={currentExercise.video_url}
                                    description={currentExercise.description}
                                    instructions={currentExercise.instructions}
                                    notes={currentExercise.notes}
                                />
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
                        exerciseName={currentExercise.name}
                        exerciseProgress={{
                            current: currentExerciseIndex + 1,
                            total: workout.exercises.length,
                            percent: Math.round(progressPercent)
                        }}
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

            {/* Fixed Finish Button - Shows when workout is COMPLETE (last exercise, all sets done) */}
            {
                isWorkoutComplete && !showCheckout && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-gradient-to-t from-background via-background to-transparent z-40">
                        <Button
                            onClick={handleFinish}
                            disabled={isSaving}
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 animate-pulse"
                        >
                            <Flag className="w-5 h-5 mr-2" />
                            {isSaving ? 'Salvando...' : '?? Finalizar Treino'}
                        </Button>
                    </div>
                )
            }

            {/* Finish button visible when workout has started but NOT complete */}
            {
                !isWorkoutComplete && completedSetsCount > 0 && !showCheckout && !showTimer && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-gradient-to-t from-background to-transparent z-40">
                        <Button
                            variant="outline"
                            onClick={handleFinishRequest}
                            disabled={isSaving}
                            className="w-full h-12 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                        >
                            <Flag className="w-4 h-4 mr-2" />
                            Finalizar Treino Antecipado
                        </Button>
                    </div>
                )
            }

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

            {/* Resume Workout Dialog */}
            <ResumeWorkoutDialog
                isOpen={showResumeDialog}
                session={savedSession}
                sessionAge={getSessionAge()}
                onResume={handleResumeSession}
                onStartNew={handleStartNewSession}
            />

            {/* Early Finish Confirmation Dialog */}
            <AlertDialog open={showEarlyFinishConfirm} onOpenChange={setShowEarlyFinishConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Finalizar treino antecipadamente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você ainda não completou todos os exercícios. Tem certeza que deseja finalizar o treino agora?
                            <br /><br />
                            <strong>Progresso atual:</strong>
                            <br /> Exercício {currentExerciseIndex + 1} de {workout.exercises.length}
                            <br /> Séries completadas: {completedSetsCount}/{adaptedSets}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continuar Treinando</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmEarlyFinish}
                            className="bg-amber-500 hover:bg-amber-600"
                        >
                            Sim, Finalizar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Exit Confirmation Dialog */}
            <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sair do treino?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Seu progresso será salvo automaticamente e você poderá continuar depois.
                            <br /><br />
                            <strong>Progresso atual:</strong>
                            <br /> Tempo: {formatTime(time)}
                            <br /> Exercício {currentExerciseIndex + 1} de {workout.exercises.length}
                            <br /> Volume total: {totalVolume}kg
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continuar Treinando</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowExitConfirm(false);
                                onExit();
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Sim, Sair
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
};

export default WorkoutSessionCOD;



