import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useWellnessCheckin } from './useWellnessCheckin';

export interface ExerciseLog {
    id?: string;
    exercise_id: string;
    exercise_name: string;
    exercise_order: number;
    prescribed_sets: number;
    prescribed_reps: number;
    prescribed_weight?: number;
    prescribed_rest_seconds: number;
    adapted_sets: number;
    adapted_reps: number;
    adapted_rest_seconds: number;
    actual_sets: number;
    actual_reps: number[];
    actual_weights: number[];
    rpe_per_set: number[];
    average_rpe?: number;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    total_volume_kg: number;
    notes?: string;
}

export interface WorkoutLog {
    id?: string;
    workout_plan_id?: string;
    session_index?: number;
    session_name?: string;
    wellness_checkin_id?: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'abandoned' | 'skipped';
    readiness_level?: 'green' | 'yellow' | 'red';
    volume_modifier: number;
    intensity_modifier: number;
    rest_modifier: number;
    started_at?: string;
    completed_at?: string;
    duration_seconds?: number;
    total_exercises: number;
    completed_exercises: number;
    total_volume_kg: number;
    average_rpe?: number;
    overall_rpe?: number;
    notes?: string;
    feeling?: 'great' | 'good' | 'okay' | 'tired' | 'exhausted';
}

export const useWorkoutLogger = () => {
    const { user } = useAuthContext();
    const { todayCheckin, modifiers, readinessLevel } = useWellnessCheckin();

    const [currentWorkoutLog, setCurrentWorkoutLog] = useState<WorkoutLog | null>(null);
    const [exerciseLogs, setExerciseLogs] = useState<Map<string, ExerciseLog>>(new Map());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Start a new workout session
    const startWorkout = useCallback(async (
        workoutPlanId: string,
        sessionIndex: number,
        sessionName: string,
        exercises: any[]
    ) => {
        if (!user?.id) return null;

        try {
            setLoading(true);

            // Create workout log
            const workoutData: Partial<WorkoutLog> = {
                workout_plan_id: workoutPlanId,
                session_index: sessionIndex,
                session_name: sessionName,
                wellness_checkin_id: todayCheckin?.id,
                status: 'in_progress',
                readiness_level: readinessLevel || 'green',
                volume_modifier: modifiers.volume,
                intensity_modifier: modifiers.intensity,
                rest_modifier: modifiers.rest,
                started_at: new Date().toISOString(),
                total_exercises: exercises.length,
                completed_exercises: 0,
                total_volume_kg: 0
            };

            const { data, error } = await supabase
                .from('workout_logs')
                .insert({
                    student_id: user.id,
                    ...workoutData
                })
                .select()
                .single();

            if (error) throw error;

            const workoutLog = data as WorkoutLog;
            setCurrentWorkoutLog(workoutLog);

            // Initialize exercise logs
            const newExerciseLogs = new Map<string, ExerciseLog>();
            exercises.forEach((ex, idx) => {
                const adaptedSets = Math.round((ex.sets || 3) * modifiers.volume);
                const adaptedReps = Math.round((ex.reps || 10) * modifiers.intensity);
                const adaptedRest = Math.round((ex.rest_time || 60) * modifiers.rest);

                newExerciseLogs.set(ex.id, {
                    exercise_id: ex.id,
                    exercise_name: ex.name,
                    exercise_order: idx,
                    prescribed_sets: ex.sets || 3,
                    prescribed_reps: ex.reps || 10,
                    prescribed_weight: ex.weight,
                    prescribed_rest_seconds: ex.rest_time || 60,
                    adapted_sets: adaptedSets,
                    adapted_reps: adaptedReps,
                    adapted_rest_seconds: adaptedRest,
                    actual_sets: 0,
                    actual_reps: [],
                    actual_weights: [],
                    rpe_per_set: [],
                    status: 'pending',
                    total_volume_kg: 0
                });
            });
            setExerciseLogs(newExerciseLogs);

            console.log('[WorkoutLogger] ✅ Started workout:', workoutLog.id);
            return workoutLog;
        } catch (err) {
            console.error('[WorkoutLogger] Error starting:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user?.id, todayCheckin, readinessLevel, modifiers]);

    // Log a completed set
    const logSet = useCallback(async (
        exerciseId: string,
        setNumber: number,
        reps: number,
        weight: number,
        rpe: number
    ) => {
        if (!currentWorkoutLog?.id) return;

        const exerciseLog = exerciseLogs.get(exerciseId);
        if (!exerciseLog) return;

        // Update local state
        const updatedLog: ExerciseLog = {
            ...exerciseLog,
            actual_sets: setNumber,
            actual_reps: [...exerciseLog.actual_reps, reps],
            actual_weights: [...exerciseLog.actual_weights, weight],
            rpe_per_set: [...exerciseLog.rpe_per_set, rpe],
            status: setNumber >= exerciseLog.adapted_sets ? 'completed' : 'in_progress',
            total_volume_kg: exerciseLog.total_volume_kg + (reps * weight)
        };

        // Calculate average RPE
        const totalRpe = updatedLog.rpe_per_set.reduce((a, b) => a + b, 0);
        updatedLog.average_rpe = totalRpe / updatedLog.rpe_per_set.length;

        const newLogs = new Map(exerciseLogs);
        newLogs.set(exerciseId, updatedLog);
        setExerciseLogs(newLogs);

        console.log('[WorkoutLogger] Set logged:', exerciseId, `Set ${setNumber}`, `${reps}x${weight}kg RPE:${rpe}`);

        return updatedLog;
    }, [currentWorkoutLog, exerciseLogs]);

    // Mark exercise as complete
    const completeExercise = useCallback(async (exerciseId: string) => {
        const exerciseLog = exerciseLogs.get(exerciseId);
        if (!exerciseLog || !currentWorkoutLog?.id) return;

        const updatedLog: ExerciseLog = {
            ...exerciseLog,
            status: 'completed'
        };

        const newLogs = new Map(exerciseLogs);
        newLogs.set(exerciseId, updatedLog);
        setExerciseLogs(newLogs);

        // Update completed count
        const completedCount = Array.from(newLogs.values()).filter(l => l.status === 'completed').length;
        setCurrentWorkoutLog(prev => prev ? { ...prev, completed_exercises: completedCount } : null);
    }, [exerciseLogs, currentWorkoutLog]);

    // Skip exercise
    const skipExercise = useCallback((exerciseId: string) => {
        const exerciseLog = exerciseLogs.get(exerciseId);
        if (!exerciseLog) return;

        const updatedLog: ExerciseLog = {
            ...exerciseLog,
            status: 'skipped'
        };

        const newLogs = new Map(exerciseLogs);
        newLogs.set(exerciseId, updatedLog);
        setExerciseLogs(newLogs);
    }, [exerciseLogs]);

    // Finish workout
    const finishWorkout = useCallback(async (
        overallRpe: number,
        feeling: 'great' | 'good' | 'okay' | 'tired' | 'exhausted',
        notes?: string
    ) => {
        if (!currentWorkoutLog?.id || !user?.id) return null;

        try {
            setSaving(true);

            const completedAt = new Date().toISOString();
            const startedAt = new Date(currentWorkoutLog.started_at || completedAt);
            const durationSeconds = Math.round((new Date(completedAt).getTime() - startedAt.getTime()) / 1000);

            // Calculate totals
            const logsArray = Array.from(exerciseLogs.values());
            const totalVolume = logsArray.reduce((sum, log) => sum + log.total_volume_kg, 0);
            const completedExercises = logsArray.filter(l => l.status === 'completed').length;
            const avgRpe = logsArray
                .filter(l => l.average_rpe)
                .reduce((sum, l, _, arr) => sum + (l.average_rpe || 0) / arr.length, 0);

            // Update workout log
            const { data: workoutData, error: workoutError } = await supabase
                .from('workout_logs')
                .update({
                    status: 'completed',
                    completed_at: completedAt,
                    duration_seconds: durationSeconds,
                    completed_exercises: completedExercises,
                    total_volume_kg: totalVolume,
                    average_rpe: avgRpe || null,
                    overall_rpe: overallRpe,
                    feeling,
                    notes
                })
                .eq('id', currentWorkoutLog.id)
                .select()
                .single();

            if (workoutError) throw workoutError;

            // Save exercise logs
            const exerciseLogsToInsert = logsArray.map(log => ({
                workout_log_id: currentWorkoutLog.id,
                exercise_id: log.exercise_id,
                exercise_name: log.exercise_name,
                exercise_order: log.exercise_order,
                prescribed_sets: log.prescribed_sets,
                prescribed_reps: log.prescribed_reps,
                prescribed_weight: log.prescribed_weight,
                prescribed_rest_seconds: log.prescribed_rest_seconds,
                adapted_sets: log.adapted_sets,
                adapted_reps: log.adapted_reps,
                adapted_rest_seconds: log.adapted_rest_seconds,
                actual_sets: log.actual_sets,
                actual_reps: log.actual_reps,
                actual_weights: log.actual_weights,
                rpe_per_set: log.rpe_per_set,
                average_rpe: log.average_rpe,
                status: log.status,
                total_volume_kg: log.total_volume_kg,
                notes: log.notes
            }));

            const { error: exerciseError } = await supabase
                .from('exercise_logs')
                .insert(exerciseLogsToInsert);

            if (exerciseError) throw exerciseError;

            console.log('[WorkoutLogger] ✅ Workout completed:', workoutData);

            // Reset state
            setCurrentWorkoutLog(null);
            setExerciseLogs(new Map());

            return workoutData;
        } catch (err) {
            console.error('[WorkoutLogger] Error finishing:', err);
            return null;
        } finally {
            setSaving(false);
        }
    }, [currentWorkoutLog, exerciseLogs, user?.id]);

    // Abandon workout
    const abandonWorkout = useCallback(async (reason?: string) => {
        if (!currentWorkoutLog?.id) return;

        try {
            await supabase
                .from('workout_logs')
                .update({
                    status: 'abandoned',
                    completed_at: new Date().toISOString(),
                    notes: reason
                })
                .eq('id', currentWorkoutLog.id);

            setCurrentWorkoutLog(null);
            setExerciseLogs(new Map());
        } catch (err) {
            console.error('[WorkoutLogger] Error abandoning:', err);
        }
    }, [currentWorkoutLog]);

    // Get adapted exercise values
    const getAdaptedExercise = useCallback((exercise: any) => {
        return {
            ...exercise,
            sets: Math.round((exercise.sets || 3) * modifiers.volume),
            reps: Math.round((exercise.reps || 10) * modifiers.intensity),
            rest_time: Math.round((exercise.rest_time || 60) * modifiers.rest),
            isAdapted: readinessLevel !== 'green'
        };
    }, [modifiers, readinessLevel]);

    return {
        // State
        currentWorkoutLog,
        exerciseLogs: Array.from(exerciseLogs.values()),
        loading,
        saving,
        isWorkoutActive: !!currentWorkoutLog,

        // Actions
        startWorkout,
        logSet,
        completeExercise,
        skipExercise,
        finishWorkout,
        abandonWorkout,

        // Helpers
        getAdaptedExercise,
        getExerciseLog: (id: string) => exerciseLogs.get(id)
    };
};
