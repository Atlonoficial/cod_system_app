import { useState } from "react";
import { Settings as SettingsIcon, Moon, Shield, HelpCircle, Info, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { HelpCenter } from "./HelpCenter";
import { AboutApp } from "./AboutApp";
import { TermsOfService } from "./TermsOfService";
import { StravaIntegrationSettings } from "./StravaIntegrationSettings";

const settingsCategories = [

  {
    title: "Aparência",
    items: [
      { id: "theme", label: "Modo Escuro", description: "Tema escuro para a interface", type: "toggle", value: true },
      { id: "animations", label: "Animações", description: "Habilitar animações da interface", type: "toggle", value: true },
    ]
  },
  {
    title: "Privacidade",
    items: [
      { id: "analytics", label: "Análise de Dados", description: "Permitir coleta para melhorias", type: "toggle", value: false },
      { id: "sharing", label: "Compartilhamento", description: "Permitir compartilhar progresso", type: "toggle", value: true },
    ]
  },
  {
    title: "Suporte",
    items: [
      { id: "help", label: "Central de Ajuda", description: "Tutoriais e FAQ", type: "navigation", icon: HelpCircle },
      { id: "about", label: "Sobre o App", description: "Versão e informações", type: "navigation", icon: Info },
      { id: "terms", label: "Termos de Uso", description: "Políticas e termos", type: "navigation", icon: Shield },
    ]
  }
];

export const Settings = () => {
  const [currentView, setCurrentView] = useState<'main' | 'help' | 'about' | 'terms'>('main');
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    workouts: true,
    meals: true,
    progress: false,
    theme: true,
    animations: true,
    analytics: false,
    sharing: true,
  });

  const handleToggle = (id: string) => {
    setToggleStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleNavigation = (view: 'help' | 'about' | 'terms') => {
    setCurrentView(view);
  };

  if (currentView === 'help') {
    return <HelpCenter onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'about') {
    return <AboutApp onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'terms') {
    return <TermsOfService onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="p-4 pt-8 pb-safe">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência</p>
      </div>

      {/* Settings Categories */}
      <div className="space-y-6">
        {/* Strava Integration */}
        <StravaIntegrationSettings />

        {settingsCategories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h3 className="text-lg font-semibold text-foreground mb-3">{category.title}</h3>

            <div className="space-y-2">
              {category.items.map((item) => (
                <Card key={item.id} className="card-gradient">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {item.type === 'navigation' && item.icon && (
                          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{item.label}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.type === 'toggle' && (
                          <Switch
                            checked={toggleStates[item.id]}
                            onCheckedChange={() => handleToggle(item.id)}
                            className="data-[state=checked]:bg-primary"
                          />
                        )}

                        {item.type === 'navigation' && (
                          <button
                            onClick={() => {
                              if (item.id === 'help') handleNavigation('help');
                              if (item.id === 'about') handleNavigation('about');
                              if (item.id === 'terms') handleNavigation('terms');
                            }}
                          >
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* App Version */}
      <Card className="mt-6 card-gradient">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">COD SYSTEM v2.1.0</p>
          <p className="text-xs text-muted-foreground mt-1">Última atualização: Janeiro 2024</p>
        </CardContent>
      </Card>
    </div>
  );
};