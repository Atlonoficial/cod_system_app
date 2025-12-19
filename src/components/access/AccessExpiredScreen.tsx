import { Clock, MessageCircle, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Tela de Acesso Expirado - Apple App Store Compliant
 * 
 * IMPORTANTE: Esta tela NÃO pode mencionar:
 * - Pagamento, assinatura, preço
 * - Links para checkout ou renovação
 * - Qualquer referência a transação financeira
 */
export const AccessExpiredScreen = () => {
    const navigate = useNavigate();
    const { student } = useStudentProfile();
    const [teacherContact, setTeacherContact] = useState<{
        name: string;
        phone: string | null;
        email: string | null;
    } | null>(null);

    // Buscar informações de contato do Personal
    useEffect(() => {
        const loadTeacherContact = async () => {
            if (!student?.teacher_id) return;

            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('name, phone, email')
                    .eq('id', student.teacher_id)
                    .single();

                if (profile) {
                    setTeacherContact({
                        name: profile.name || 'Seu Personal',
                        phone: profile.phone,
                        email: profile.email
                    });
                }
            } catch (e) {
                console.error('Error loading teacher contact:', e);
            }
        };

        loadTeacherContact();
    }, [student?.teacher_id]);

    const handleContactPersonal = () => {
        // Priorizar WhatsApp se disponível
        if (teacherContact?.phone) {
            const cleanPhone = teacherContact.phone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}`;

            if (Capacitor.isNativePlatform()) {
                window.open(whatsappUrl, '_system');
            } else {
                window.open(whatsappUrl, '_blank');
            }
        } else if (teacherContact?.email) {
            const subject = encodeURIComponent('Sobre meu acesso ao app');
            const body = encodeURIComponent('Olá! Gostaria de falar sobre meu acesso ao app.');
            window.open(`mailto:${teacherContact.email}?subject=${subject}&body=${body}`, '_blank');
        }
    };

    const handleViewProfile = () => {
        navigate('/perfil');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <Card className="w-full max-w-md p-8 text-center space-y-6">
                {/* Ícone */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center">
                        <Clock className="w-10 h-10 text-warning" />
                    </div>
                </div>

                {/* Título - SEM mencionar assinatura/pagamento */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        Acesso Limitado
                    </h1>
                    <p className="text-muted-foreground">
                        Seu período de acesso terminou.
                    </p>
                </div>

                {/* Mensagem - Apple Compliant */}
                <p className="text-foreground">
                    Para continuar acessando seus treinos personalizados,
                    entre em contato com {teacherContact?.name || 'seu Personal'}.
                </p>

                {/* Botões */}
                <div className="space-y-3">
                    {/* Contatar Personal - Principal */}
                    <Button
                        onClick={handleContactPersonal}
                        className="w-full gap-2"
                        size="lg"
                        disabled={!teacherContact?.phone && !teacherContact?.email}
                    >
                        <MessageCircle className="w-5 h-5" />
                        Falar com {teacherContact?.name || 'Personal'}
                    </Button>

                    {/* Ver Perfil - Secundário */}
                    <Button
                        onClick={handleViewProfile}
                        variant="outline"
                        className="w-full gap-2"
                    >
                        <User className="w-5 h-5" />
                        Ver meu perfil
                    </Button>

                    {/* Sair - Terciário */}
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full gap-2 text-muted-foreground"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair da conta
                    </Button>
                </div>
            </Card>

            {/* Footer */}
            <p className="text-xs text-muted-foreground mt-8 text-center max-w-sm">
                Dúvidas? Entre em contato com seu Personal para mais informações sobre seu acesso.
            </p>
        </div>
    );
};

export default AccessExpiredScreen;
