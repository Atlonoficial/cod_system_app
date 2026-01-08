import { ArrowLeft, Search, MessageCircle, Book, Video, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface HelpCenterProps {
  onBack: () => void;
}

const helpCategories = [
  {
    title: "Primeiros Passos",
    icon: Book,
    items: [
      "Como criar meu perfil",
      "Configurando objetivos",
      "Primeiro treino",
      "Configurações básicas"
    ]
  },
  {
    title: "Treinos",
    icon: Video,
    items: [
      "Como iniciar um treino",
      "Personalizar exercícios",
      "Acompanhar progresso",
      "Histórico de treinos"
    ]
  },
  {
    title: "Nutrição",
    icon: MessageCircle,
    items: [
      "Planejamento de refeições",
      "Contador de calorias",
      "Dicas nutricionais",
      "Receitas saudáveis"
    ]
  }
];

export const HelpCenter = ({ onBack }: HelpCenterProps) => {
  return (
    <div className="p-4 pt-safe pb-safe">
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
        <h1 className="text-2xl font-bold text-foreground">Central de Ajuda</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          placeholder="Buscar ajuda..."
          className="w-full pl-10 pr-4 py-3 bg-card/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="card-gradient cursor-pointer hover:scale-105 transition-transform">
          <CardContent className="p-4 text-center">
            <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Chat Suporte</p>
          </CardContent>
        </Card>

        <Card className="card-gradient cursor-pointer hover:scale-105 transition-transform">
          <CardContent className="p-4 text-center">
            <Phone className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Ligar</p>
          </CardContent>
        </Card>
      </div>

      {/* Help Categories */}
      <div className="space-y-6">
        {helpCategories.map((category, index) => (
          <div key={index}>
            <div className="flex items-center gap-3 mb-3">
              <category.icon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
            </div>

            <div className="space-y-2">
              {category.items.map((item, itemIndex) => (
                <Card key={itemIndex} className="card-gradient cursor-pointer hover:bg-card/70 transition-colors">
                  <CardContent className="p-4">
                    <p className="text-foreground">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};