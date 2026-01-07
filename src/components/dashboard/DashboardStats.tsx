import { MetricCard } from "../ui/MetricCard";
import { Flame, Target } from "lucide-react";
import { useWorkoutStats } from "@/hooks/useWorkoutStats";

/**
 * DashboardStats - Exibe estatísticas de treinos do usuário
 * BUILD 64: Agora busca dados reais via useWorkoutStats
 */
export const DashboardStats = () => {
  const {
    completedThisMonth,
    todayCalories,
    estimatedCalories,
    loading
  } = useWorkoutStats();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="metric-card animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-6 bg-muted rounded mb-1"></div>
            <div className="h-3 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <MetricCard
        title="Calorias Queimadas"
        value={todayCalories.toString()}
        subtitle={`Total mês: ${estimatedCalories}`}
        icon={<Flame size={20} />}
        trend={todayCalories > 0 ? "up" : "neutral"}
      />

      <MetricCard
        title="Treinos Concluídos"
        value={completedThisMonth.toString()}
        subtitle="Este mês"
        icon={<Target size={20} />}
        trend={completedThisMonth > 0 ? "up" : "neutral"}
      />
    </div>
  );
};