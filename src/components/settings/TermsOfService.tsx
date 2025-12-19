import { ArrowLeft, Scale, Eye, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService = ({ onBack }: TermsOfServiceProps) => {
  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hover:bg-card/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Termos de Uso</h1>
      </div>

      {/* Terms Sections */}
      <div className="space-y-6">
        <Card className="card-gradient">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Termos de Uso</h2>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Ao usar o COD SYSTEM, você concorda com os seguintes termos e condições:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>O uso do aplicativo é destinado para fins de fitness e bem-estar</li>
                <li>Você é responsável pela veracidade das informações fornecidas</li>
                <li>O app não substitui orientação médica profissional</li>
                <li>Recomendamos consultar um médico antes de iniciar qualquer programa de exercícios</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Política de Privacidade</h2>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Sua privacidade é importante para nós. Coletamos apenas dados necessários para:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Personalizar sua experiência no aplicativo</li>
                <li>Acompanhar seu progresso de fitness</li>
                <li>Melhorar nossos serviços</li>
                <li>Enviar notificações relevantes (quando permitido)</li>
              </ul>
              <p className="mt-3">
                Não compartilhamos seus dados pessoais com terceiros sem seu consentimento.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Implementamos medidas de segurança para proteger suas informações:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Criptografia de dados sensíveis</li>
                <li>Autenticação segura</li>
                <li>Armazenamento local quando possível</li>
                <li>Atualizações regulares de segurança</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="card-gradient">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Entre em Contato</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Dúvidas sobre nossos termos?</p>
              <p className="mt-2">Entre em contato diretamente com seu Treinador para mais informações sobre o serviço contratado.</p>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="text-center text-xs text-muted-foreground">
          Última atualização: Janeiro 2024
        </div>
      </div>
    </div>
  );
};