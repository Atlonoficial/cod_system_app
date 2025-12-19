import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useWorkoutPlans, type WorkoutPlan } from './useWorkoutPlans';
import { offlineStorage } from '@/services/offline/offlineStorage';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  sets: string;
  reps: number;
  weight?: number;
  duration?: number;
  rest_time: number;
  notes?: string;
  muscle_groups?: string[];
  equipment?: string[];
  difficulty?: string;
  instructions?: string;
  video_url?: string;
  image_url?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  notes?: string;
  exercises: Exercise[];
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  sessions_per_week: number;
  sessions: WorkoutSession[];
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useWorkouts = () => {
  const { user } = useAuthContext();
  const { currentPlan, loading: plansLoading, workoutPlans } = useWorkoutPlans();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert WorkoutPlan to Workout format for compatibility
  const convertWorkoutPlan = (plan: WorkoutPlan): Workout => {
    let sessions: WorkoutSession[] = [];

    if (Array.isArray(plan.exercises_data)) {
      // Case 1: Standard structure (Array of Sessions)
      if (plan.exercises_data.length > 0 && 'exercises' in plan.exercises_data[0]) {
        sessions = plan.exercises_data.map(sessionData => ({
          id: sessionData.id || `session-${Math.random()}`,
          name: sessionData.name || 'Treino Principal',
          notes: sessionData.notes,
          exercises: Array.isArray(sessionData.exercises)
            ? sessionData.exercises.map((exData, idx) => {
              const ex = exData as any; // Cast for dynamic properties
              const category = ex.category || ex.type || 'Força';
              const fallbackName = `Exercício #${idx + 1} (${category})`;

              return {
                id: ex.id || `ex-${Math.random()}`,
                name: ex.name || ex.exercise || ex.exerciseName || fallbackName,
                category: category,
                sets: ex.sets || '3',
                reps: ex.reps || 12,
                weight: ex.weight,
                duration: ex.duration,
                rest_time: ex.rest_time || ex.rest_seconds || 60,
                notes: ex.notes || ex.instructions,
                muscle_groups: ex.muscle_groups || [],
                equipment: ex.equipment || [],
                difficulty: ex.difficulty || plan.difficulty,
                instructions: ex.instructions || ex.notes || '',
                video_url: ex.video_url || '',
                image_url: ex.image_url || ''
              };
            })
            : []
        }));
      }
      // Case 2: Flat Array of Exercises (AI Generated often does this)
      else if (plan.exercises_data.length > 0) {
        sessions = [{
          id: `session-${plan.id}`,
          name: 'Treino Completo',
          notes: plan.description,
          exercises: plan.exercises_data.map((ex: any, idx: number) => {
            // Build a meaningful name if none provided
            const category = ex.category || ex.type || 'Força';
            const fallbackName = `Exercício #${idx + 1} (${category})`;

            return {
              id: ex.id || `ex-${Math.random()}`,
              name: ex.name || ex.exercise || ex.exerciseName || fallbackName,
              category: category,
              sets: ex.sets || '3',
              reps: ex.reps || 12,
              weight: ex.weight,
              duration: ex.duration,
              rest_time: ex.rest_time || ex.rest_seconds || 60,
              notes: ex.notes || ex.instructions,
              muscle_groups: ex.muscle_groups || [],
              equipment: ex.equipment || [],
              difficulty: ex.difficulty || plan.difficulty,
              instructions: ex.instructions || ex.notes || '',
              video_url: ex.video_url || '',
              image_url: ex.image_url || ''
            };
          })
        }];
      }
    }

    return {
      id: plan.id,
      name: plan.description || plan.name, // ✅ Use description (custom name like "Método AGT") when available
      description: plan.description,
      difficulty: plan.difficulty,
      duration_weeks: plan.duration_weeks,
      sessions_per_week: plan.sessions_per_week,
      sessions,
      tags: plan.tags,
      notes: plan.notes,
      created_at: plan.created_at,
      updated_at: plan.updated_at
    };
  };

  // Load from Offline Storage on mount
  useEffect(() => {
    const loadOfflineWorkouts = async () => {
      if (!user?.id) return;
      try {
        const cachedWorkouts = await offlineStorage.get<Workout[]>(`workouts_${user.id}`);
        if (cachedWorkouts && cachedWorkouts.length > 0) {
          console.log('📦 [useWorkouts] Loaded from offline storage');
          setWorkouts(cachedWorkouts);
          setLoading(false); // Show data immediately
        }
      } catch (error) {
        console.error('Failed to load offline workouts', error);
      }
    };

    loadOfflineWorkouts();
  }, [user?.id]);

  // Convert workout plans to workouts format and save to offline storage
  useEffect(() => {
    if (workoutPlans && workoutPlans.length > 0) {
      const convertedWorkouts = workoutPlans
        .filter(plan => plan.status === 'active')
        .map(convertWorkoutPlan);

      setWorkouts(convertedWorkouts);

      // Save to offline storage
      if (user?.id) {
        offlineStorage.set(`workouts_${user.id}`, convertedWorkouts)
          .then(() => console.log('💾 [useWorkouts] Saved to offline storage'))
          .catch(err => console.error('Failed to save offline workouts', err));
      }
    } else if (!plansLoading && workoutPlans) {
      // Only clear if we are sure there are no plans (loaded and empty)
      // But be careful not to wipe offline data if fetch failed (plansLoading would be false but maybe error?)
      // For now, we trust workoutPlans source.
      setWorkouts([]);
    }
  }, [workoutPlans, user?.id, plansLoading]);

  // Update loading state only if we didn't have offline data
  useEffect(() => {
    if (workouts.length === 0) {
      setLoading(plansLoading);
    }
  }, [plansLoading, workouts.length]);

  // Get current workout (from current plan)
  const currentWorkout = currentPlan ? convertWorkoutPlan(currentPlan) : (workouts.length > 0 ? workouts[0] : null);

  return {
    workouts,
    currentWorkout,
    loading,
    // Legacy compatibility
    user
  };
};