import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TermosDeUso() {
    const navigate = useNavigate();
    const lastUpdated = "14 de Janeiro de 2026";

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="text-foreground"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Termos de Uso</h1>
                            <p className="text-xs text-muted-foreground">Atualizado em {lastUpdated}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Introdução */}
                <section className="prose prose-invert max-w-none">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8">
                        <h2 className="text-lg font-semibold text-primary mb-3">Bem-vindo ao COD SYSTEM</h2>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            Ao usar nosso aplicativo, você concorda com estes Termos de Uso. Por favor, leia atentamente
                            antes de continuar. Se você não concordar com algum termo, não utilize o aplicativo.
                        </p>
                    </div>

                    {/* 1. Definições */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <h3 className="text-base font-semibold text-foreground mb-4">1. Definições</h3>
                        <ul className="space-y-2 text-sm text-foreground/80">
                            <li><strong>"Aplicativo"</strong> ou <strong>"COD SYSTEM"</strong>: refere-se ao aplicativo móvel de treino personalizado.</li>
                            <li><strong>"Usuário"</strong> ou <strong>"você"</strong>: pessoa física que utiliza o aplicativo.</li>
                            <li><strong>"Serviços"</strong>: funcionalidades oferecidas pelo aplicativo, incluindo treinos, acompanhamento de progresso, e integração com dados de saúde.</li>
                            <li><strong>"Professor"</strong>: profissional de educação física responsável pela elaboração e acompanhamento dos treinos.</li>
                        </ul>
                    </div>

                    {/* 2. Aceitação dos Termos */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <h3 className="text-base font-semibold text-foreground mb-4">2. Aceitação dos Termos</h3>
                        <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                            Ao criar uma conta ou utilizar o COD SYSTEM, você:</
            </p>
                    <ul className="space-y-2 text-sm text-foreground/80 list-disc ml-6">
                        <li>Confirma ter lido e compreendido estes Termos de Uso</li>
                        <li>Concorda em cumprir todas as regras aqui estabelecidas</li>
                        <li>Declara ser maior de 18 anos ou ter autorização de responsável legal</li>
                        <li>Aceita nossa Política de Privacidade</li>
                    </ul>
            </div>

            {/* 3. Cadastro e Conta */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">3. Cadastro e Segurança da Conta</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                    Para utilizar o aplicativo, você deve:
                </p>
                <ul className="space-y-2 text-sm text-foreground/80 list-disc ml-6">
                    <li>Fornecer informações verdadeiras, completas e atualizadas</li>
                    <li>Manter a confidencialidade de sua senha</li>
                    <li>Notificar imediatamente sobre uso não autorizado de sua conta</li>
                    <li>Ser responsável por todas as atividades realizadas em sua conta</li>
                </ul>
                <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-xs text-warning font-medium">
                        ⚠️ Não compartilhe suas credenciais de acesso com terceiros.
                    </p>
                </div>
            </div>

            {/* 4. Uso Adequado */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">4. Uso Adequado do Aplicativo</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                    Você concorda em utilizar o aplicativo apenas para fins legítimos e não deve:
                </p>
                <ul className="space-y-2 text-sm text-foreground/80 list-disc ml-6">
                    <li>Violar leis locais, estaduais, nacionais ou internacionais</li>
                    <li>Transmitir conteúdo ofensivo, difamatório, fraudulento ou ilegal</li>
                    <li>Tentar hackear, modificar ou interferir no funcionamento do aplicativo</li>
                    <li>Fazer engenharia reversa do código-fonte</li>
                    <li>Utilizar bots, scripts ou ferramentas automatizadas</li>
                    <li>Compartilhar ou revender acesso ao aplicativo</li>
                </ul>
            </div>

            {/* 5. Serviços de Saúde */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">5. Serviços de Saúde e Fitness</h3>
                <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                    <p>
                        O COD SYSTEM oferece orientações de treino personalizadas, mas <strong>não substitui orientação médica profissional</strong>.
                    </p>
                    <p>
                        Antes de iniciar qualquer programa de exercícios:
                    </p>
                    <ul className="space-y-2 list-disc ml-6 mb-3">
                        <li>Consulte um médico, especialmente se tiver condições de saúde pré-existentes</li>
                        <li>Informe seu professor sobre lesões, limitações ou restrições médicas</li>
                        <li>Respeite seus limites físicos e pare imediatamente se sentir dor ou desconforto</li>
                    </ul>
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-xs text-destructive font-semibold">
                            ⚠️ ISENÇÃO DE RESPONSABILIDADE: O COD SYSTEM não se responsabiliza por lesões,
                            danos ou problemas de saúde decorrentes do uso inadequado das orientações de treino.
                        </p>
                    </div>
                </div>
            </div>

            {/* 6. Dados de Saúde e Apple HealthKit */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">6. Integração com Apple Health</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                    Se você optar por conectar o Apple HealthKit:
                </p>
                <ul className="space-y-2 text-sm text-foreground/80 list-disc ml-6">
                    <li>Seus dados de saúde são sincronizados apenas com sua autorização explícita</li>
                    <li>Você pode revogar o acesso a qualquer momento nas configurações do iPhone</li>
                    <li>Não compartilhamos dados de saúde com terceiros sem seu consentimento</li>
                    <li>Os dados são armazenados de forma criptografada</li>
                </ul>
            </div>

            {/* 7. Planos e Pagamentos */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">7. Planos e Pagamentos</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                    O acesso ao COD SYSTEM pode requerer assinatura de plano:
                </p>
                <ul className="space-y-2 text-sm text-foreground/80 list-disc ml-6">
                    <li>Os valores serão informados antes da contratação</li>
                    <li>Renovações automáticas podem ser canceladas a qualquer momento</li>
                    <li>Reembolsos seguem a política da App Store (Apple)</li>
                    <li>Mudanças de preço serão comunicadas com 30 dias de antecedência</li>
                </ul>
            </div>

            {/* 8. Propriedade Intelectual */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">8. Propriedade Intelectual</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                    Todo o conteúdo do aplicativo (código, design, marca, textos, vídeos) é propriedade
                    exclusiva do COD SYSTEM ou de seus licenciadores e está protegido por leis de direitos autorais.
                </p>
            </div>

            {/* 9. Privacidade */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">9. Privacidade de Dados</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                    Consulte nossa <a href="/politica-de-privacidade" className="text-primary underline hover:text-primary/80">Política de Privacidade</a> para
                    entender como coletamos, usamos e protegemos seus dados pessoais.
                </p>
            </div>

            {/* 10. Modificações */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">10. Modificações nos Termos</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                    Reservamo-nos o direito de atualizar estes Termos a qualquer momento.
                    Mudanças significativas serão notificadas via e-mail ou notificação no aplicativo.
                </p>
            </div>

            {/* 11. Encerramento */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">11. Encerramento de Conta</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                    Você pode excluir sua conta a qualquer momento através das configurações do app.
                    Também podemos suspender ou encerrar sua conta se você violar estes Termos.
                </p>
            </div>

            {/* 12. Lei Aplicável */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                <h3 className="text-base font-semibold text-foreground mb-4">12. Lei Aplicável e Foro</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                    Estes Termos são regidos pelas leis da República Federativa do Brasil.
                    Qualquer disputa será resolvida no foro da comarca de [Cidade], Brasil.
                </p>
            </div>
        </section>

        {/* Contato */ }
    <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 rounded-xl p-6">
        <h3 className="text-base font-semibold text-foreground mb-3">📧 Dúvidas ou Sugestões?</h3>
        <p className="text-sm text-foreground/80 mb-3">
            Entre em contato conosco:
        </p>
        <p className="text-sm text-primary font-medium">
            Email: contato@metodocod.com
        </p>
    </div>

    {/* Última Atualização */ }
    <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
            Última atualização: {lastUpdated}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
            Versão 1.0
        </p>
    </div>
      </div >
    </div >
  );
}
