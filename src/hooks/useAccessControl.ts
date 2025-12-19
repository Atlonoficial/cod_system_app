import { useMemo } from 'react';
import { useActiveSubscription } from './useActiveSubscription';

/**
 * Hook para controle de acesso baseado no status da assinatura
 * Apple Compliant - Não menciona pagamentos
 */
export const useAccessControl = () => {
    const { subscription, loading, hasActiveSubscription } = useActiveSubscription();

    const accessStatus = useMemo(() => {
        if (loading) {
            return {
                hasAccess: true, // Assume acesso durante loading para evitar flash
                status: 'loading' as const,
                reason: null
            };
        }

        // Verifica se tem assinatura ativa
        if (hasActiveSubscription) {
            return {
                hasAccess: true,
                status: 'active' as const,
                reason: null
            };
        }

        // Sem assinatura ativa
        return {
            hasAccess: false,
            status: 'expired' as const,
            reason: 'access_expired'
        };
    }, [loading, hasActiveSubscription]);

    return {
        ...accessStatus,
        loading,
        subscription,
        teacherId: subscription?.teacher_id || null
    };
};

export type AccessStatus = 'loading' | 'active' | 'expired';
