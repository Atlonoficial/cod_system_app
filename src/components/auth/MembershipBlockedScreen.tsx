import { Browser } from '@capacitor/browser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, MessageCircle, Info } from 'lucide-react';

interface Props {
    teacherPhone: string | null;
}

export const MembershipBlockedScreen = ({ teacherPhone }: Props) => {
    const handleContactTeacher = () => {
        if (!teacherPhone) return;
        const cleanPhone = teacherPhone.replace(/\D/g, '');
        const message = encodeURIComponent('Olá! Criei minha conta no app e gostaria de ativar meu acesso.');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
        Browser.open({ url: whatsappUrl, presentationStyle: 'fullscreen' });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Card className="max-w-md w-full bg-slate-800/50 border-slate-700 p-8 shadow-2xl">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-slate-700/50 rounded-full flex items-center justify-center">
                    <Lock className="w-10 h-10 text-slate-400" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-center text-white mb-2">
                    Acesso Pendente
                </h1>

                {/* Description */}
                <p className="text-center text-slate-300 mb-8 leading-relaxed">
                    Sua conta foi criada com sucesso! Para liberar o acesso aos treinos e funcionalidades, entre em contato com seu Personal Trainer.
                </p>

                {/* Action */}
                {teacherPhone ? (
                    <Button
                        onClick={handleContactTeacher}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 shadow-lg shadow-primary/20"
                        size="lg"
                    >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Falar com meu Personal
                    </Button>
                ) : (
                    <div className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <Info className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Entre em contato com seu Personal Trainer para ativar seu acesso ao app.
                        </p>
                    </div>
                )}

                {/* Footer info */}
                <p className="text-xs text-center text-slate-500 mt-6">
                    Após a ativação, você terá acesso completo a todos os recursos
                </p>
            </Card>
        </div>
    );
};
