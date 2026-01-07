import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface AnamnesisRequest {
    id: string;
    template_id: string;
    status: 'pending' | 'completed';
    created_at: string;
    template: {
        title: string;
        description: string;
        questions: any[];
    };
}

export const useStudentAnamnesisRequests = () => {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<AnamnesisRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_anamnesis_records')
                .select(`
          *,
          template:anamnesis_templates(*)
        `)
                .eq('student_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Cast template questions from JSON to array if needed suitable for frontend
            const typedData = data?.map(d => ({
                ...d,
                template: d.template ? { ...d.template, questions: d.template.questions } : null
            })) as AnamnesisRequest[];

            setPendingRequests(typedData || []);
        } catch (error) {
            console.error('Error fetching anamnesis requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitInternalAnamnesis = async (requestId: string, answers: any) => {
        try {
            const { error } = await supabase
                .from('student_anamnesis_records')
                .update({
                    answers,
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) throw error;

            // Remove from local list
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            return true;
        } catch (error) {
            console.error('Error submitting anamnesis:', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [user]);

    return {
        pendingRequests,
        loading,
        submitAnamnesis: submitInternalAnamnesis,
        refetch: fetchRequests
    };
};
