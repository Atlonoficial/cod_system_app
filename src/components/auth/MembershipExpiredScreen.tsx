import { useState } from 'react';
import { Browser } from '@capacitor/browser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Globe, MessageCircle, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
    expiryDate: string | null;
    teacherPhone: string | null;
    studentId: string | null;
    onRenewed: () => void;
}

export const MembershipExpiredScreen = ({ expiryDate, teacherPhone, studentId, onRenewed }: Props) => {
    const [renewing, setRenewing] = useState(false);

    const handleRenewOnline = async () => {
        setRenewing(true);

        try {
            // URL do dashboard com página de renovação
            const baseUrl = import.meta.env.VITE_DASHBOARD_URL || 'https://metodocod.com';
            const renewalUrl = `${baseUrl}/renovar?student=${studentId || ''}&returning=true`;

            console.log('[MembershipExpired] Opening renewal URL:', renewalUrl);

            // Abrir in-app browser (Apple-compliant)
            await Browser.open({
                url: renewalUrl,
                presentationStyle: 'fullscreen',
                toolbarColor: '#0f172a'
            });

            // Listener para quando fechar o browser
            Browser.addListener('browserFinished', () => {
                console.log('[MembershipExpired] Browser closed, reloading status...');
                setRenewing(false);
                // Recarregar status para ver se pagou
                onRenewed();
            });
        } catch (err) {
            console.error('[MembershipExpired] Error opening browser:', err);
            setRenewing(false);
        }
    };

    const handleContactTeacher = () => {
        if (!teacherPhone) return;
        const cleanPhone = teacherPhone.replace(/\D/g, '');
        const message = encodeURIComponent('Olá! Meu plano expirou e gostaria de renovar.');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
        Browser.open({ url: whatsappUrl, presentationStyle: 'fullscreen' });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-destructive/20">
            <Card className="max-w-md w-full bg-slate-800/50 border-destructive/50 p-8 shadow-2xl">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-destructive/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-center text-white mb-2">
                    Acesso Expirado
                </h1>

                {/* Expiry date */}
                {expiryDate && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6">
                        <Clock className="w-4 h-4" />
                        <span>
                            Venceu em {format(new Date(expiryDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                    </div>
                )}

                {/* Description */}
                <p className="text-center text-slate-300 mb-8 leading-relaxed">
                    Seu período de consultoria terminou. Para continuar utilizando o app e ter acesso aos treinos, é necessário renovar.
                </p>

                {/* Actions */}
                <div className="space-y-3">
                    {/* Opção 1: Renovar online */}
                    <Button
                        onClick={handleRenewOnline}
                        disabled={renewing}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 shadow-lg shadow-primary/20"
                        size="lg"
                    >
                        {renewing ? (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Abrindo...
                            </>
                        ) : (
                            <>
                                <Globe className="w-5 h-5 mr-2" />
                                Renovar Online
                            </>
                        )}
                    </Button>

                    {/* Opção 2: Contatar personal */}
                    {teacherPhone && (
                        <Button
                            onClick={handleContactTeacher}
                            variant="outline"
                            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50 py-6"
                            size="lg"
                        >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Falar com meu Personal
                        </Button>
                    )}
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-center text-slate-500 mt-6">
                    Você será redirecionado para nosso site de pagamento seguro
                </p>
            </Card>
        </div>
    );
};
