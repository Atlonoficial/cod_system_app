import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

export const usePendingRequestsCount = () => {
    const { user } = useAuthContext();
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchCount = async () => {
        if (!user?.id) {
            setCount(0);
            setLoading(false);
            return;
        }

        try {
            const { count: requestCount, error } = await (supabase
                .from('student_requests' as any)
                .select('*', { count: 'exact', head: true })
                .eq('student_id', user.id)
                .eq('status', 'pending') as any);

            if (error) throw error;
            setCount(requestCount || 0);
        } catch (error) {
            console.error('Erro ao buscar contagem:', error);
            setCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCount();

        // Refetch every 30 seconds
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [user?.id]);

    return { count, loading, refetch: fetchCount };
};
