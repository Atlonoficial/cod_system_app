import { Plus, Apple, Clock, Target, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useMyNutrition } from "@/hooks/useMyNutrition";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AddCustomMealDialog } from "@/components/nutrition/AddCustomMealDialog";

export const RegistrarRefeicao = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activePlan, todaysMeals, dailyStats, loading, logMeal, planMeals, hasNutritionAccess } = useMyNutrition();
  const { toast } = useToast();
  const [loadingMeals, setLoadingMeals] = useState<Set<string>>(new Set());
  const [showAddMealDialog, setShowAddMealDialog] = useState(false);

  const handleMealToggle = async (mealId: string, isCompleted: boolean) => {
    if (!user?.id) return;

    setLoadingMeals(prev => new Set([...prev, mealId]));

    try {
      await logMeal(mealId, !isCompleted);
      toast({
        title: !isCompleted ? "Refeição registrada!" : "Registro removido",
        description: !isCompleted ? "Refeição marcada como concluída." : "Refeição desmarcada.",
      });
    } catch (error) {
      console.error('Error logging meal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a refeição. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingMeals(prev => {
        const newSet = new Set(prev);
        newSet.delete(mealId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 pt-safe pb-safe-4xl flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando suas refeições...</p>
        </div>
      </div>
    );
  }

  // CORRIGIDO: Verificar por todaysMeals ao invés de activePlan
  if (!hasNutritionAccess || todaysMeals.length === 0) {
    return (
      <div className="p-4 pt-safe pb-safe-4xl">
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
            <h1 className="text-2xl font-bold text-foreground">Controle Nutricional</h1>
            <p className="text-sm text-muted-foreground">Registre suas refeições de hoje</p>
          </div>
        </div>

        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma refeição programada para hoje.</p>
          <p className="text-sm text-muted-foreground mt-2">
            {hasNutritionAccess ?
              'Aguarde seu nutricionista programar suas refeições!' :
              'Entre em contato com seu professor para ativar seu acesso.'
            }
          </p>
        </div>
      </div>
    );
  }

  const { consumed, target } = dailyStats;

  return (
    <div className="p-4 pt-safe pb-safe-4xl">
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
          <h1 className="text-2xl font-bold text-foreground">Controle Nutricional</h1>
          <p className="text-sm text-muted-foreground">Registre suas refeições de hoje</p>
        </div>
      </div>

      {/* Resumo Calórico */}
      <Card className="card-gradient p-6 mb-6 border border-warning/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Meta Calórica</h3>
            <p className="text-sm text-muted-foreground">{Math.round(consumed.calories)} / {Math.round(target.calories)} kcal</p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-warning to-warning/80 rounded-full flex items-center justify-center">
            <Target size={24} className="text-white" />
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-warning to-warning/80 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(target.calories > 0 ? (consumed.calories / target.calories) * 100 : 0, 100)}%` }}
          ></div>
        </div>

        <div className="text-center">
          <span className="text-sm font-medium text-foreground">
            Restam {Math.round(Math.max(target.calories - consumed.calories, 0))} kcal
          </span>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Refeições de Hoje</h3>
          <Button
            size="sm"
            className="btn-primary"
            onClick={() => setShowAddMealDialog(true)}
          >
            <Plus size={16} className="mr-1" />
            Adicionar
          </Button>
        </div>

        {todaysMeals && todaysMeals.length > 0 ? (
          todaysMeals.map((meal, index) => {
            const isLoading = loadingMeals.has(meal.meal_plan_item_id);

            return (
              <Card key={meal.meal_plan_item_id || index} className="card-gradient p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{meal.meal_name}</h4>
                      {meal.meal_time && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{meal.meal_time}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-warning font-medium">{meal.calories || 0} kcal</span>
                      {meal.is_logged && (
                        <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                          Concluído
                        </span>
                      )}
                    </div>

                    {meal.foods && Array.isArray(meal.foods) && meal.foods.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          {meal.foods.map(food => food.name).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin text-muted-foreground" />
                    ) : meal.is_logged ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMealToggle(meal.meal_plan_item_id, true)}
                      >
                        <Apple size={16} className="text-success mr-1" />
                        Concluído
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMealToggle(meal.meal_plan_item_id, false)}
                      >
                        Registrar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma refeição programada para hoje.</p>
          </div>
        )}
      </div>

      {/* Dicas Nutricionais */}
      <Card className="card-gradient p-4 mt-6 border border-accent/20">
        <h4 className="font-medium text-foreground mb-2">💡 Dica do Dia</h4>
        <p className="text-sm text-muted-foreground">
          Mantenha-se hidratado! Beba pelo menos 2 litros de água ao longo do dia.
        </p>
      </Card>

      {/* Dialog para adicionar refeição customizada */}
      <AddCustomMealDialog
        open={showAddMealDialog}
        onOpenChange={setShowAddMealDialog}
        nutritionPlanId={activePlan?.id}
        onMealAdded={() => {
          // Força uma atualização dos dados
          window.location.reload();
        }}
      />
    </div>
  );
};