import { ArrowLeft, Star, Heart, Code, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AboutAppProps {
  onBack: () => void;
}

export const AboutApp = ({ onBack }: AboutAppProps) => {
  return (
    <div className="p-4 pt-8 pb-safe">
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
        <h1 className="text-2xl font-bold text-foreground">Sobre o App</h1>
      </div>

      {/* App Logo/Info */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">COD SYSTEM</h2>
        <p className="text-muted-foreground mb-2">Versão 2.1.0</p>
        <p className="text-sm text-muted-foreground">Seu companheiro de fitness</p>
      </div>

      {/* App Description */}
      <Card className="card-gradient mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">Sobre o COD SYSTEM</h3>
          <p className="text-muted-foreground mb-4">
            O COD SYSTEM é seu aplicativo completo para fitness e bem-estar.
            Desenvolvido para ajudar você a alcançar seus objetivos de saúde
            com treinos personalizados, nutrição inteligente e acompanhamento
            de progresso.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>4.8/5</span>
            </div>
            <div className="flex items-center gap-1">
              <Code className="w-4 h-4" />
              <span>React + TypeScript</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recursos Principais</h3>

        {[
          { title: "Treinos Personalizados", desc: "Exercícios adaptados ao seu nível" },
          { title: "Nutrição Inteligente", desc: "Planos alimentares balanceados" },
          { title: "Progresso Detalhado", desc: "Acompanhe sua evolução" },
          { title: "Comunidade", desc: "Conecte-se com outros usuários" }
        ].map((feature, index) => (
          <Card key={index} className="card-gradient">
            <CardContent className="p-4">
              <h4 className="font-medium text-foreground mb-1">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legal */}
      <Card className="card-gradient">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h4 className="font-medium text-foreground">Informações Legais</h4>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>© 2024 COD SYSTEM. Todos os direitos reservados.</p>
            <p>Última atualização: Janeiro 2024</p>
            <p>Desenvolvido com ❤️ para sua saúde</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};