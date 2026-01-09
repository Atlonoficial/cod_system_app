import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

const ConfiguracoesNotificacoes = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const {
    preferences,
    loading,
    togglePush,
    updatePreferences,
    permissionStatus
  } = useNotificationPreferences(user?.id);

  const notificationTypes = [
    {
      key: 'workout_reminders' as const,
      title: "Lembretes de Treino",
      description: "Receber notificações sobre treinos agendados",
      icon: "🏋️"
    },
    {
      key: 'achievements' as const,
      title: "Conquistas",
      description: "Notificações sobre marcos e objetivos alcançados",
      icon: "🏆"
    },
    {
      key: 'social' as const,
      title: "Interações Sociais",
      description: "Curtidas, comentários e novos seguidores",
      icon: "👥"
    },
    {
      key: 'tips' as const,
      title: "Dicas e Motivação",
      description: "Receber dicas de treino e mensagens motivacionais",
      icon: "💡"
    }
  ];

  const handleToggleType = async (key: keyof typeof preferences) => {
    if (!preferences) return;

    try {
      await updatePreferences({
        [key]: !preferences[key]
      });
    } catch (error) {
      console.error("Erro ao atualizar preferência:", error);
    }
  };

  const isPushDisabled = !preferences?.push_enabled || permissionStatus === 'denied';

  return (
    <div className="page-scroll-container flex flex-col">
      {/* Header */}
      <div className="p-4 pt-safe border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/configuracoes")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Notificações</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Push Toggle */}
        <Card className="p-4 bg-card/50 border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔔</div>
              <div>
                <h3 className="font-semibold text-foreground">Notificações Push</h3>
                <p className="text-sm text-muted-foreground">
                  {preferences?.push_enabled
                    ? "Ativadas - Você receberá notificações"
                    : "Desativadas - Nenhuma notificação será enviada"}
                </p>
                {permissionStatus === 'denied' && (
                  <p className="text-xs text-destructive mt-1">
                    Permissão negada. Habilite nas configurações do dispositivo.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  checked={preferences?.push_enabled ?? true}
                  onCheckedChange={togglePush}
                  disabled={loading || permissionStatus === 'denied'}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Info Card */}
        {isPushDisabled && (
          <Card className="p-4 bg-muted/30 border-border/30">
            <p className="text-sm text-muted-foreground text-center">
              {permissionStatus === 'denied'
                ? "⚠️ As notificações estão bloqueadas nas configurações do seu dispositivo. Habilite-as para continuar."
                : "ℹ️ Ative as notificações push acima para configurar os tipos de notificação."}
            </p>
          </Card>
        )}

        <Separator className="my-6" />

        {/* Notification Types */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2">
            Tipos de Notificação
          </h2>

          {notificationTypes.map((type) => (
            <Card
              key={type.key}
              className={`p-4 bg-card/50 border-border/50 transition-all ${isPushDisabled ? 'opacity-50' : 'hover:bg-card/70'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{type.icon}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">{type.title}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      checked={preferences?.[type.key] ?? true}
                      onCheckedChange={() => handleToggleType(type.key)}
                      disabled={loading || isPushDisabled}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
          <p className="text-primary text-sm">
            💡 <strong>Dica:</strong> Você pode personalizar cada tipo de notificação individualmente para receber apenas o que importa para você.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesNotificacoes;
