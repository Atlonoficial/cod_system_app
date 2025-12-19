import { Target, TrendingUp, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useGoals } from "@/hooks/useGoals";
import { AddGoalDialog } from "@/components/goals/AddGoalDialog";
import { UpdateProgressDialog } from "@/components/goals/UpdateProgressDialog";

const categoryColors: Record<string, string> = {
  peso: "success",
  cardio: "primary",
  forca: "warning",
  frequencia: "accent",
  general: "secondary"
};

const categoryLabels: Record<string, string> = {
  peso: "Peso",
  cardio: "Cardio",
  forca: "Força",
  frequencia: "Frequência",
  general: "Geral"
};

export const Metas = () => {
  const navigate = useNavigate();
  const { goals, loading, getGoalStats } = useGoals();

  const stats = getGoalStats();
  const activeGoals = goals.filter(goal => goal.status === 'active');

  const estatisticas = [
    {
      label: "Metas Ativas",
      valor: stats.activeGoals.toString(),
      icone: Target,
      cor: "primary"
    },
    {
      label: "Concluídas",
      valor: stats.completedGoals?.toString() || "0",
      icone: Target,
      cor: "warning"
    },
    {
      label: "Progresso Médio",
      valor: `${stats.averageProgress}%`,
      icone: TrendingUp,
      cor: "success"
    }
  ];

  if (loading) {
    return (
      <div className="p-4 pt-8 pb-safe-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Metas e Progresso</h1>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="card-gradient p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-8 pb-safe-4xl">
      {/* Header com botão de volta */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Metas e Progresso</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seu desenvolvimento</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {estatisticas.map((stat, index) => (
          <Card key={index} className="card-gradient p-4 border border-border/50">
            <div className="text-center">
              <stat.icone size={20} className={`text-${stat.cor} mx-auto mb-2`} />
              <div className="text-lg font-bold text-foreground">{stat.valor}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Botão Adicionar Meta */}
      <div className="mb-6">
        <AddGoalDialog />
      </div>

      {/* Metas Ativas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Metas Ativas</h3>
          <span className="text-sm text-muted-foreground">{activeGoals.length} metas</span>
        </div>

        {activeGoals.length === 0 ? (
          <Card className="card-gradient p-8 text-center border border-border/50">
            <Target size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-medium text-foreground mb-2">Nenhuma meta ativa</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Comece definindo suas metas pessoais para acompanhar seu progresso
            </p>
            <AddGoalDialog trigger={
              <Button className="btn-primary">
                <Plus size={18} className="mr-2" />
                Criar Primeira Meta
              </Button>
            } />
          </Card>
        ) : (
          activeGoals.map((meta) => {
            const cor = categoryColors[meta.category] || "primary";
            const categoria = categoryLabels[meta.category] || meta.category;

            return (
              <Card key={meta.id} className="card-gradient p-6 border border-border/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-lg">{meta.title}</h4>
                    <p className="text-sm text-muted-foreground">{meta.description}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-muted rounded-full">
                      {categoria}
                    </span>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br from-${cor} to-${cor}/80 rounded-full flex items-center justify-center`}>
                    <Target size={20} className="text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium text-foreground">{Math.round(meta.progress_percentage)}%</span>
                  </div>

                  <Progress value={meta.progress_percentage} className="h-2" />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {meta.current_value} / {meta.target_value} {meta.target_unit}
                    </span>
                    {meta.target_date && (
                      <span className="text-warning">
                        até {new Date(meta.target_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    Editar
                  </Button>
                  <UpdateProgressDialog
                    goal={meta}
                    trigger={
                      <Button size="sm" className="btn-primary flex-1">
                        Atualizar
                      </Button>
                    }
                  />
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Dica Motivacional */}
      <Card className="card-gradient p-4 mt-6 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-variant rounded-full flex items-center justify-center">
            <span className="text-sm">💡</span>
          </div>
          <div>
            <h4 className="font-medium text-foreground">Dica de Progresso</h4>
            <p className="text-sm text-muted-foreground">
              {activeGoals.length === 0
                ? "Defina metas específicas e mensuráveis. O progresso acontece um passo de cada vez!"
                : "Continue firme! Atualize seu progresso regularmente para manter a motivação em alta!"
              }
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
