import { AccessGate } from '@/components/access';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

/**
 * SubscriptionGuard - App Store Compliance (3.1.1)
 * 
 * Verifica se o usuário tem acesso ativo.
 * Se expirado, mostra tela de "Contatar Personal" (sem menções a pagamento).
 * 
 * Rotas protegidas por este guard só ficam acessíveis com assinatura ativa.
 * Quando expira, o usuário vê uma tela nativa pedindo para contatar o Personal.
 */
export const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
    return (
        <AccessGate>
            {children}
        </AccessGate>
    );
};
