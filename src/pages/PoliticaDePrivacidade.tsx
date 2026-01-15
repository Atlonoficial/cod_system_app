import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/card";

export default function PoliticaDePrivacidade() {
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
                            <h1 className="text-xl font-bold text-foreground">Política de Privacidade</h1>
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
                        <div className="flex items-start gap-3">
                            <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h2 className="text-lg font-semibold text-primary mb-3">Seu direito à privacidade é nossa prioridade</h2>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    Esta Política de Privacidade explica como o <strong>COD SYSTEM</strong> coleta, usa, armazena e
                                    protege seus dados pessoais. Estamos comprometidos com a transparência e conformidade com a
                                    LGPD (Lei Geral de Proteção de Dados) e GDPR (General Data Protection Regulation).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 1. Dados Coletados */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="w-5 h-5 text-primary" />
                            <h3 className="text-base font-semibold text-foreground">1. Dados que Coletamos</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">📋 Dados de Cadastro</h4>
                                <ul className="space-y-1 text-sm text-foreground/80 list-disc ml-6">
                                    <li>Nome completo</li>
                                    <li>E-mail</li>
                                    <li>Telefone (WhatsApp)</li>
                                    <li>Foto de perfil (opcional)</li>
                                    <li>Data de nascimento</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">🏋️ Dados de Treino e Fitness</h4>
                                <ul className="space-y-1 text-sm text-foreground/80 list-disc ml-6">
                                    <li>Histórico de treinos executados</li>
                                    <li>Séries, repetições e carga utilizadas</li>
                                    <li>Tempo de treino</li>
                                    <li>RPE (Rate of Perceived Exertion)</li>
                                    <li>Fotos de progresso (opcional)</li>
                                    <li>Medidas corporais (peso, altura, % gordura, massa muscular)</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">❤️ Dados de Saúde (Apple HealthKit - Opcional)</h4>
                                <p className="text-xs text-muted-foreground mb-2">
                                    Somente se você conectar o Apple Health:
                                </p>
                                <ul className="space-y-1 text-sm text-foreground/80 list-disc ml-6">
                                    <li>Sono (duração e qualidade)</li>
                                    <li>Passos diários</li>
                                    <li>Frequência cardíaca</li>
                                    <li>Variabilidade da frequência cardíaca (HRV)</li>
                                    <li>Calorias queimadas</li>
                                    <li>Atividade física</li>
                                </ul>
                                <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                    <p className="text-xs text-primary font-medium">
                                        🔒 Seus dados de saúde <strong>NUNCA</strong> são compartilhados com terceiros.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">📷 Câmera e Fotos</h4>
                                <ul className="space-y-1 text-sm text-foreground/80 list-disc ml-6">
                                    <li>Fotos de progresso físico enviadas ao professor</li>
                                    <li>Fotos de refeições (se habilitado)</li>
                                    <li>Foto de perfil do usuário</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">📍 Localização (Opcional)</h4>
                                <ul className="space-y-1 text-sm text-foreground/80 list-disc ml-6">
                                    <li>Localização aproximada para recomendação de academias próximas</li>
                                    <li>Rastreamento GPS em treinos outdoor (corrida, ciclismo)</li>
                                </ul>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Você pode desativar o acesso à localização a qualquer momento nas configurações do iOS.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">📊 Dados de Uso e Analytics</h4>
                                <ul className="space-y-1 text-sm text-foreground/80 list-disc ml-6">
                                    <li>Páginas visitadas no app</li>
                                    <li>Tempo de uso</li>
                                    <li>Funcionalidades mais utilizadas</li>
                                    <li>Dispositivo e versão do iOS</li>
                                    <li>Identificador único do dispositivo (anonimizado)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 2. Como Usamos Seus Dados */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Eye className="w-5 h-5 text-primary" />
                            <h3 className="text-base font-semibold text-foreground">2. Como Usamos Seus Dados</h3>
                        </div>

                        <ul className="space-y-2 text-sm text-foreground/80 list-disc ml-6">
                            <li><strong>Personalização de treinos:</strong> Criar planos adaptados ao seu nível e objetivos</li>
                            <li><strong>Acompanhamento de progresso:</strong> Monit orar evolução de peso, força e performance</li>
                            <li><strong>Comunicação:</strong> Enviar notificações sobre treinos, lembretes e atualizações</li>
                            <li><strong>suporte:</strong> Responder dúvidas e resolver problemas técnicos</li>
                            <li><strong>Melhorar o app:</strong> Analisar uso para otimizar funcionalidades</li>
                            <li><strong>Segurança:</strong> Detectar fraudes e prevenir uso indevido</li>
                        </ul>

                        <div className="mt-4 p-4 bg-accent/20 border border-accent/30 rounded-lg">
                            <p className="text-xs text-foreground/80 font-medium mb-2">
                                ✅ <strong>Base Legal (LGPD):</strong>
                            </p>
                            <ul className="text-xs text-foreground/70 space-y-1 list-disc ml-6">
                                <li>Execução de contrato (Art. 7º, V)</li>
                                <li>Consentimento explícito (Art. 7º, I)</li>
                                <li>Legítimo interesse (Art. 7º, IX)</li>
                            </ul>
                        </div>
                    </div>

                    {/* 3. Compartilhamento com Terceiros */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Globe className="w-5 h-5 text-primary" />
                            <h3 className="text-base font-semibold text-foreground">3. Compartilhamento com Terceiros</h3>
                        </div>

                        <p className="text-sm text-foreground/80 mb-4">
                            Para oferecer nossos serviços, utilizamos as seguintes plataformas confiáveis:
                        </p>

                        <div className="space-y-4">
                            <div className="p-4 bg-muted/30 border border-border/30 rounded-lg">
                                <h4 className="text-sm font-semibold text-foreground mb-2">🗄️ Supabase (Armazenamento de Dados)</h4>
                                <p className="text-xs text-foreground/70 mb-2">
                                    <strong>Dados compartilhados:</strong> Perfil do usuário, histórico de treinos, medidas corporais
                                </p>
                                <p className="text-xs text-foreground/70 mb-2">
                                    <strong>Finalidade:</strong> Armazenamento seguro e sincronização entre dispositivos
                                </p>
                                <p className="text-xs text-foreground/70">
                                    <strong>Localização:</strong> Servidores nos EUA (conforme GDPR)
                                </p>
                            </div>

                            <div className="p-4 bg-muted/30 border border-border/30 rounded-lg">
                                <h4 className="text-sm font-semibold text-foreground mb-2">🔔 OneSignal (Notificações Push)</h4>
                                <p className="text-xs text-foreground/70 mb-2">
                                    <strong>Dados compartilhados:</strong> Token do dispositivo, idioma, timezone
                                </p>
                                <p className="text-xs text-foreground/70 mb-2">
                                    <strong>Finalidade:</strong> Enviar lembretes de treinos e notificações importantes
                                </p>
                                <p className="text-xs text-foreground/70">
                                    <strong>Opção:</strong> Você pode desativar notificações nas configurações do iPhone
                                </p>
                            </div>

                            <div className="p-4 bg-muted/30 border border-border/30 rounded-lg">
                                <h4 className="text-sm font-semibold text-foreground mb-2">❤️ Apple HealthKit (Dados de Saúde)</h4>
                                <p className="text-xs text-foreground/70 mb-2">
                                    <strong>Dados compartilhados:</strong> Sono, passos, frequência cardíaca, HRV
                                </p>
                                <p className="text-xs text-foreground/70 mb-2">
                                    <strong>Finalidade:</strong> Personalizar treinos com base no seu nível de recuperação
                                </p>
                                <p className="text-xs text-foreground/70">
                                    <strong>Privacidade:</strong> Dados de saúde permanecem no seu dispositivo (Apple App Sandbox)
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                            <p className="text-xs text-primary font-semibold mb-2">
                                🤖 <strong>Sobre Inteligência Artificial:</strong>
                            </p>
                            <p className="text-xs text-foreground/80">
                                Seus dados <strong>NÃO</strong> são usados para treinamento de modelos de IA.
                                Não compartilhamos informações pessoais com serviços de AI de terceiros sem seu consentimento explícito.
                            </p>
                        </div>
                    </div>

                    {/* 4. Armazenamento e Segurança */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Lock className="w-5 h-5 text-primary" />
                            <h3 className="text-base font-semibold text-foreground">4. Segurança e Armazenamento</h3>
                        </div>

                        <div className="space-y-3 text-sm text-foreground/80">
                            <p>
                                Implementamos medidas técnicas e organizacionais para proteger seus dados:
                            </p>
                            <ul className="space-y-2 list-disc ml-6">
                                <li><strong>Criptografia:</strong> Dados em trânsito (HTTPS/TLS) e em repouso (AES-256)</li>
                                <li><strong>Autenticação:</strong> Login seguro com e-mail/senha ou Google OAuth</li>
                                <li><strong>Controle de acesso:</strong> Apenas colaboradores autorizados acessam dados</li>
                                <li><strong>Backups:</strong> Backups automáticos diários com retenção de 30 dias</li>
                                <li><strong>Monitoramento:</strong> Logs de segurança e detecção de anomalias</li>
                            </ul>

                            <div className="p-3 bg-muted/30 border border-border/30 rounded-lg mt-4">
                                <p className="text-xs text-foreground/70">
                                    <strong>Período de retenção:</strong> Mantemos seus dados enquanto sua conta estiver ativa.
                                    Após exclusão da conta, dados são removidos em até 30 dias.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 5. Seus Direitos (LGPD/GDPR) */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-primary" />
                            <h3 className="text-base font-semibold text-foreground">5. Seus Direitos (LGPD/GDPR)</h3>
                        </div>

                        <p className="text-sm text-foreground/80 mb-4">
                            Conforme a LGPD (Lei 13.709/2018) e GDPR, você tem os seguintes direitos:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-muted/30 border border-border/30 rounded-lg">
                                <p className="text-xs font-semibold text-foreground mb-1">✅ Acesso</p>
                                <p className="text-xs text-foreground/70">Solicitar cópia dos seus dados</p>
                            </div>

                            <div className="p-3 bg-muted/30 border border-border/30 rounded-lg">
                                <p className="text-xs font-semibold text-foreground mb-1">✏️ Correção</p>
                                <p className="text-xs text-foreground/70">Atualizar dados incorretos</p>
                            </div>

                            <div className="p-3 bg-muted/30 border border-border/30 rounded-lg">
                                <p className="text-xs font-semibold text-foreground mb-1">🗑️ Exclusão</p>
                                <p className="text-xs text-foreground/70">Deletar sua conta permanentemente</p>
                            </div>

                            <div className="p-3 bg-muted/30 border border-border/30 rounded-lg">
                                <p className="text-xs font-semibold text-foreground mb-1">📥 Portabilidade</p>
                                <p className="text-xs text-foreground/70">Exportar dados em formato legível</p>
                            </div>

                            <div className="p-3 bg-muted/30 border border-border/30 rounded-lg">
                                <p className="text-xs font-semibold text-foreground mb-1">🚫 Oposição</p>
                                <p className="text-xs text-foreground/70">Recusar processamento de dados</p>
                            </div>

                            <div className="p-3 bg-muted/30 border border-border/30 rounded-lg">
                                <p className="text-xs font-semibold text-foreground mb-1">⏸️ Limitação</p>
                                <p className="text-xs text-foreground/70">Restringir uso de dados</p>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                            <p className="text-xs text-primary font-semibold mb-2">
                                <Trash2 className="w-4 h-4 inline mr-1" />
                                Como exercer seus direitos:
                            </p>
                            <ul className="text-xs text-foreground/80 space-y-1 list-disc ml-6">
                                <li>Exclusão de conta: App → Configurações → Excluir Minha Conta</li>
                                <li>Outros direitos: Envie e-mail para <strong className="text-primary">contato@metodocod.com</strong></li>
                                <li>Prazo de resposta: Até 15 dias úteis</li>
                            </ul>
                        </div>
                    </div>

                    {/* 6. Cookies e Tracking */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <h3 className="text-base font-semibold text-foreground mb-4">6. Cookies e Rastreamento</h3>
                        <p className="text-sm text-foreground/80 mb-3">
                            Não utilizamos cookies no aplicativo móvel. Para análise de uso, coletamos dados anônimos via:
                        </p>
                        <ul className="space-y-2 text-sm text-foreground/80 list-disc ml-6">
                            <li><strong>App Tracking Transparency (ATT):</strong> Pedimos permissão antes de rastrear</li>
                            <li><strong>Analytics:</strong> Dados agregados e anonimizados para melhorias</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-3">
                            Você pode recusar rastreamento em: iOS Settings → Privacy → Tracking
                        </p>
                    </div>

                    {/* 7. Menores de Idade */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <h3 className="text-base font-semibold text-foreground mb-4">7. Crianças e Adolescentes</h3>
                        <p className="text-sm text-foreground/80">
                            O COD SYSTEM é destinado a maiores de 18 anos. Menores podem usar com autorização e supervisão
                            de pais ou responsáveis legais, que assumem total responsabilidade pelo uso.
                        </p>
                    </div>

                    {/* 8. Transferência Internacional */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <h3 className="text-base font-semibold text-foreground mb-4">8. Transferência Internacional de Dados</h3>
                        <p className="text-sm text-foreground/80 mb-3">
                            Alguns dados podem ser armazenados em servidores fora do Brasil (ex: Supabase nos EUA).
                            Garantimos que esses parceiros:
                        </p>
                        <ul className="space-y-1 text-sm text-foreground/80 list-disc ml-6">
                            <li>Estão em conformidade com GDPR</li>
                            <li>Possuem certificações de segurança (ISO 27001, SOC 2)</li>
                            <li>Aplicam cláusulas contratuais padrão da UE</li>
                        </ul>
                    </div>

                    {/* 9. Mudanças na Política */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <h3 className="text-base font-semibold text-foreground mb-4">9. Alterações nesta Política</h3>
                        <p className="text-sm text-foreground/80">
                            Podemos atualizar esta Política periodicamente. Mudanças significativas serão notificadas
                            por e-mail ou notificação no app 30 dias antes de entrarem em vigor.
                        </p>
                    </div>

                    {/* 10. Encarregado de Dados (DPO) */}
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 mb-6">
                        <h3 className="text-base font-semibold text-foreground mb-4">10. Encarregado de Proteção de Dados (DPO)</h3>
                        <p className="text-sm text-foreground/80 mb-3">
                            Para questões sobre privacidade, entre em contato com nosso DPO:
                        </p>
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <p className="text-sm text-primary font-medium">
                                📧 Email: dpo@metodocod.com
                            </p>
                        </div>
                    </div>
                </section>

                {/* Contato */}
                <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 rounded-xl p-6">
                    <h3 className="text-base font-semibold text-foreground mb-3">💬 Dúvidas sobre Privacidade?</h3>
                    <p className="text-sm text-foreground/80 mb-4">
                        Estamos à disposição para esclarecer qualquer questão sobre o uso dos seus dados.
                    </p>
                    <div className="space-y-2">
                        <p className="text-sm text-primary font-medium">
                            📧 Email: contato@metodocod.com
                        </p>
                        <p className="text-sm text-primary font-medium">
                            🔐 DPO: dpo@metodocod.com
                        </p>
                    </div>
                </div>

                {/* Última Atualização */}
                <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">
                        Última atualização: {lastUpdated}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Versão 1.0 | Conforme LGPD (Lei 13.709/2018) e GDPR
                    </p>
                </div>
            </div>
        </div>
    );
}
