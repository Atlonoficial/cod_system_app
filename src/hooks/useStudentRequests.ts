import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

export interface StudentRequest {
    id: string;
    trainer_id: string;
    student_id: string;
    type: 'exam' | 'photo' | 'document' | 'other';
    title: string;
    description?: string;
    status: 'pending' | 'completed' | 'cancelled';
    metadata?: {
        exam_category?: string;
        photo_types?: string[];
    };
    created_at: string;
    updated_at: string;
}

export const useStudentRequests = () => {
    const { user } = useAuthContext();
    const [requests, setRequests] = useState<StudentRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        if (!user?.id) return;
        setLoading(true);

        try {
            const { data, error } = await (supabase
                .from('student_requests' as any)
                .select('*')
                .eq('student_id', user.id)
                .order('created_at', { ascending: false }) as any);

            if (error) throw error;
            setRequests((data || []) as StudentRequest[]);
        } catch (error) {
            console.error('Erro ao buscar solicitações:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsCompleted = async (requestId: string) => {
        try {
            const { error } = await (supabase
                .from('student_requests' as any)
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', requestId) as any);

            if (error) throw error;

            // Update local state
            setRequests(prev => prev.map(r =>
                r.id === requestId ? { ...r, status: 'completed' as const } : r
            ));
            return true;
        } catch (error) {
            console.error('Erro ao marcar como concluído:', error);
            return false;
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [user?.id]);

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const examRequests = pendingRequests.filter(r => r.type === 'exam');
    const photoRequests = pendingRequests.filter(r => r.type === 'photo');

    return {
        requests,
        pendingRequests,
        examRequests,
        photoRequests,
        pendingCount: pendingRequests.length,
        loading,
        markAsCompleted,
        refetch: fetchRequests
    };
};
