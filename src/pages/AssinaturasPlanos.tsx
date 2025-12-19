import { useMemo, useEffect, useState } from "react";
import { ArrowLeft, Check, Shield, User, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AssinaturasPlanos = () => {
  const navigate = useNavigate();
  const { student } = useStudentProfile();
  const { subscription } = useActiveSubscription();
  const [teacherPhone, setTeacherPhone] = useState<string | null>(null);

  useEffect(() => {
    const loadTeacherInfo = async () => {
      if (!student?.teacher_id) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', student.teacher_id)
          .single();

        if (profile?.phone) {
          setTeacherPhone(profile.phone);
        }
      } catch (e) {
        console.error('Error loading teacher profile:', e);
      }
    };
    loadTeacherInfo();
  }, [student?.teacher_id]);

  const planoAtual = useMemo(() => {
    if (subscription) {
      return {
        nome: subscription.plan_name,
        status: subscription.status,
        features: subscription.plan_features || [],
        daysRemaining: subscription.daysRemaining,
        expirationStatus: subscription.expirationStatus
      };
    }

    if (!student?.active_plan) return null;
    return {
      nome: student.active_plan === 'free' ? 'Acesso Básico' : student.active_plan,
      status: student.membership_status || "ativo",
      features: [],
      daysRemaining: undefined,
      expirationStatus: undefined
    };
  }, [subscription, student?.active_plan, student?.membership_status]);

  const handleContactTeacher = () => {
    if (!teacherPhone) return;
    const cleanPhone = teacherPhone.replace(/\D/g, '');
    const message = "Olá! Gostaria de tirar dúvidas sobre meu acesso ao app.";
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-safe-4xl">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/configuracoes")}
              className="text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Meu Acesso</h1>
          </div>
          <ConnectionStatus />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status do Acesso */}
        <Card className={`p-6 bg-card border-border/50 ${planoAtual?.expirationStatus === 'expired' ? 'border-destructive/50 bg-destructive/5' : ''}`}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${planoAtual?.expirationStatus === 'expired' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                {planoAtual?.expirationStatus === 'expired' ? (
                  <Shield className="w-6 h-6 text-destructive" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Status da Conta</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={`${planoAtual?.expirationStatus === 'expired'
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}>
                    {planoAtual?.expirationStatus === 'expired' ? 'Expirado' : (planoAtual?.status === 'active' ? 'Ativo' : 'Regular')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <h3 className="text-sm font-medium text-foreground mb-2">
                {planoAtual?.expirationStatus === 'expired' ? 'Acesso Expirado' : 'Recursos Liberados'}
              </h3>

              {planoAtual?.expirationStatus === 'expired' ? (
                <p className="text-sm text-muted-foreground">
                  Seu período de acesso encerrou. Entre em contato com seu treinador para renovar sua consultoria e liberar o acesso aos treinos e funcionalidades.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Alguns recursos podem estar bloqueados dependendo da configuração feita pelo seu treinador.
                  </p>

                  {planoAtual?.features && planoAtual.features.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {planoAtual.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4" />
              <span>Para suporte ou dúvidas, fale diretamente com seu treinador.</span>
            </div>

            {teacherPhone && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleContactTeacher}
              >
                Fale com seu Treinador
              </Button>
            )}
          </div>
        </Card>

        {/* Disclaimer Google Play / Apple */}
        <div className="space-y-4 pt-4">
          <Alert className="bg-muted/50 border-border/50">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
              Este aplicativo NÃO fornece diagnóstico, aconselhamento ou tratamento médico.
              Todo o conteúdo é destinado exclusivamente a fins educativos e de condicionamento físico,
              sendo o acompanhamento realizado por profissionais de Educação Física.
            </AlertDescription>
          </Alert>

          <p className="text-xs text-center text-muted-foreground/50">
            COD SYSTEM App • Versão Leitor
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssinaturasPlanos;