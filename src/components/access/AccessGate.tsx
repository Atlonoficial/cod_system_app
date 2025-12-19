import { ReactNode } from 'react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { AccessExpiredScreen } from './AccessExpiredScreen';
import { Loader2 } from 'lucide-react';

interface AccessGateProps {
    children: ReactNode;
    /** Se true, mostra loading durante verificação */
    showLoading?: boolean;
    /** Componente customizado para quando não tem acesso */
    fallback?: ReactNode;
}

/**
 * AccessGate - Wrapper que controla acesso a conteúdo protegido
 * 
 * Uso:
 * <AccessGate>
 *   <ProtectedContent />
 * </AccessGate>
 * 
 * O conteúdo só será exibido se o usuário tiver acesso ativo.
 * Se expirado, mostra AccessExpiredScreen automaticamente.
 */
export const AccessGate = ({
    children,
    showLoading = true,
    fallback
}: AccessGateProps) => {
    const { hasAccess, loading, status } = useAccessControl();

    // Mostra loading enquanto verifica
    if (loading && showLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Verificando acesso...</p>
                </div>
            </div>
        );
    }

    // Se não tem acesso, mostra tela de expirado
    if (!hasAccess && status === 'expired') {
        return fallback ? <>{fallback}</> : <AccessExpiredScreen />;
    }

    // Acesso liberado
    return <>{children}</>;
};

export default AccessGate;
