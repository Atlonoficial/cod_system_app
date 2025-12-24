import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Interface para Mesociclo no App do Aluno
 */
export interface StudentMesocycle {
    id: string;
    name: string;
    description: string | null;
    goal: string | null;
    duration_weeks: number;
    start_date: string | null;
    end_date: string | null;
    status: 'draft' | 'active' | 'completed' | 'archived';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    created_at: string;
    // Microciclos (treinos) dentro do mesociclo
    microcycles: StudentMicrocycle[];
}

export interface StudentMicrocycle {
    id: string;
    name: string;
    description: string | null;
    session_name: string | null;
    order_in_mesocycle: number;
    exercises: any; // JSON dos exercícios
    difficulty: string | null;
    estimated_duration: number | null;
}

/**
 * Hook para buscar Mesociclos atribuídos ao aluno
 */
export const useStudentMesocycles = () => {
    const { user } = useAuth();
    const [mesocycles, setMesocycles] = useState<StudentMesocycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMesocycles = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('📚 [useStudentMesocycles] Buscando mesociclos para aluno:', user.id);

            // Buscar mesociclos onde o aluno está atribuído
            const { data: mesocyclesData, error: mesocyclesError } = await supabase
                .from('mesocycles')
                .select('*')
                .contains('assigned_students', [user.id])
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (mesocyclesError) throw mesocyclesError;

            if (!mesocyclesData || mesocyclesData.length === 0) {
                console.log('📚 [useStudentMesocycles] Nenhum mesociclo atribuído');
                setMesocycles([]);
                setLoading(false);
                return;
            }

            console.log('📚 [useStudentMesocycles] Mesociclos encontrados:', mesocyclesData.length);

            // Para cada mesociclo, buscar seus microciclos (workouts)
            const mesocyclesWithMicrocycles = await Promise.all(
                mesocyclesData.map(async (mesocycle) => {
                    const { data: microcyclesData } = await supabase
                        .from('workouts')
                        .select('*')
                        .eq('mesocycle_id', mesocycle.id)
                        .eq('is_template', true)
                        .order('order_in_mesocycle', { ascending: true });

                    return {
                        ...mesocycle,
                        microcycles: microcyclesData || []
                    };
                })
            );

            setMesocycles(mesocyclesWithMicrocycles);
            console.log('✅ [useStudentMesocycles] Carregado com sucesso');

        } catch (err) {
            console.error('❌ [useStudentMesocycles] Erro:', err);
            setError(err instanceof Error ? err.message : 'Erro ao carregar mesociclos');
            setMesocycles([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Carregar ao montar
    useEffect(() => {
        fetchMesocycles();
    }, [fetchMesocycles]);

    // Mesociclo ativo atual
    const currentMesocycle = mesocycles.length > 0 ? mesocycles[0] : null;

    return {
        mesocycles,
        currentMesocycle,
        loading,
        error,
        refetch: fetchMesocycles
    };
};
