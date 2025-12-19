import { ArrowLeft, Shield, Eye, Lock, Database, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const PoliticaPrivacidade = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Eye,
      title: "Coleta de Informações",
      content: [
        "Coletamos informações que você nos fornece diretamente, como nome, email e dados de perfil.",
        "Dados de uso do aplicativo para melhorar sua experiência.",
        "Informações de progresso físico e treinos para personalização.",
        "Dados de dispositivo para otimização e segurança."
      ]
    },
    {
      icon: Database,
      title: "Como Usamos Suas Informações",
      content: [
        "Personalizar treinos e planos nutricionais.",
        "Fornecer suporte ao cliente e responder suas dúvidas.",
        "Enviar notificações importantes sobre seu progresso.",
        "Melhorar nossos serviços e desenvolver novos recursos.",
        "Garantir a segurança e integridade da plataforma."
      ]
    },
    {
      icon: Users,
      title: "Compartilhamento de Dados",
      content: [
        "Não vendemos suas informações pessoais para terceiros.",
        "Podemos compartilhar dados com prestadores de serviços confiáveis.",
        "Dados anonimizados podem ser usados para pesquisa e melhorias.",
        "Compartilhamento apenas quando exigido por lei."
      ]
    },
    {
      icon: Lock,
      title: "Segurança dos Dados",
      content: [
        "Utilizamos criptografia de ponta para proteger seus dados.",
        "Servidores seguros com monitoramento 24/7.",
        "Acesso restrito aos dados apenas para equipe autorizada.",
        "Backups regulares para prevenir perda de informações.",
        "Auditorias de segurança regulares."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-safe-4xl">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/configuracoes")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Política de Privacidade</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Introdução */}
        <Card className="p-6 bg-primary/10 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-primary">Sua Privacidade é Nossa Prioridade</h2>
          </div>
          <p className="text-primary/80 text-sm leading-relaxed">
            No COD SYSTEM, levamos sua privacidade a sério. Esta política explica como coletamos,
            usamos e protegemos suas informações pessoais quando você usa nosso aplicativo.
          </p>
          <p className="text-primary/80 text-sm mt-3">
            <strong>Última atualização:</strong> Janeiro de 2024
          </p>
        </Card>

        {/* Seções da Política */}
        {sections.map((section, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            </div>

            <div className="space-y-3">
              {section.content.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* Seus Direitos */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Seus Direitos</h2>
          <div className="space-y-3">
            <div className="p-4 bg-card/50 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Acesso aos Dados</h3>
              <p className="text-sm text-muted-foreground">
                Você pode solicitar uma cópia de todos os dados que temos sobre você.
              </p>
            </div>
            <div className="p-4 bg-card/50 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Correção de Dados</h3>
              <p className="text-sm text-muted-foreground">
                Você pode corrigir informações incorretas ou desatualizadas.
              </p>
            </div>
            <div className="p-4 bg-card/50 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Exclusão de Dados</h3>
              <p className="text-sm text-muted-foreground">
                Você pode solicitar a exclusão de seus dados pessoais.
              </p>
            </div>
          </div>
        </Card>

        {/* Transações Financeiras */}
        <Card className="p-6 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-700" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Transações Financeiras</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            O COD SYSTEM <strong>não processa, armazena ou gerencia transações financeiras</strong> dentro do aplicativo.
            Todas as negociações de valores, pagamentos e assinaturas são realizadas diretamente entre
            você e seu instrutor, fora do aplicativo. Não coletamos informações de cartão de crédito,
            dados bancários ou qualquer informação financeira. O acesso aos conteúdos premium é controlado
            manualmente pelo seu instrutor após a negociação externa.
          </p>
        </Card>

        {/* Contato */}
        <Card className="p-4 bg-primary/10 border-primary/20">
          <h3 className="font-medium text-primary mb-2">Dúvidas sobre Privacidade?</h3>
          <p className="text-sm text-primary/80 mb-3">
            Se você tiver alguma dúvida sobre nossa política de privacidade ou sobre como
            tratamos seus dados, entre em contato conosco.
          </p>
          <Button variant="outline" size="sm" className="text-primary border-primary/30">
            Contatar Suporte
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;