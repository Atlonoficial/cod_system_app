import { useMemo, useState, useEffect, useRef } from 'react';
import { useActiveSubscription } from './useActiveSubscription';

// Delay mínimo para evitar race conditions de DOM durante transições rápidas
const MIN_LOADING_DELAY_MS = 300;
// Timeout máximo para evitar loading infinito
const MAX_LOADING_TIMEOUT_MS = 3000;

/**
 * Hook para controle de acesso baseado no status da assinatura
 * Apple Compliant - Não menciona pagamentos
 * 
 * Inclui delay mínimo para prevenir erros de DOM (insertBefore) 
 * causados por mudanças de estado muito rápidas.
 * 
 * ⚠️ SAFETY: Inclui timeout máximo de 3s para evitar loading infinito
 */
export const useAccessControl = () => {
    const { subscription, loading: subscriptionLoading, hasActiveSubscription } = useActiveSubscription();

    // Estado para garantir um tempo mínimo de loading
    const [minDelayComplete, setMinDelayComplete] = useState(false);
    // ⚠️ SAFETY: Force stop loading after timeout
    const [forceComplete, setForceComplete] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasStartedRef = useRef(false);

    // Inicia o timer apenas uma vez quando o hook é montado
    useEffect(() => {
        if (!hasStartedRef.current) {
            hasStartedRef.current = true;

            // Timer mínimo
            timerRef.current = setTimeout(() => {
                setMinDelayComplete(true);
            }, MIN_LOADING_DELAY_MS);

            // ⚠️ SAFETY: Timeout máximo para forçar fim do loading
            maxTimeoutRef.current = setTimeout(() => {
                console.warn('[useAccessControl] ⚠️ Maximum loading timeout reached, forcing complete');
                setForceComplete(true);
            }, MAX_LOADING_TIMEOUT_MS);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            if (maxTimeoutRef.current) {
                clearTimeout(maxTimeoutRef.current);
            }
        };
    }, []);

    // Loading é true se ainda está carregando OU se o delay mínimo não completou
    // ⚠️ SAFETY: Se forceComplete=true, loading é SEMPRE false (evita loading infinito)
    const loading = forceComplete ? false : (subscriptionLoading || !minDelayComplete);

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
