import { MetricCard } from "../ui/MetricCard";
import { Flame, Target, Zap, Trophy } from "lucide-react";


interface DashboardStatsProps {
  workouts: any[];
  progress: any[];
  loading?: boolean;
}

export const DashboardStats = ({ workouts, progress, loading }: DashboardStatsProps) => {


  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-6 bg-muted rounded mb-1"></div>
            <div className="h-3 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate real statistics from Supabase data

  const thisMonthWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.completedAt || w.createdAt);
    const now = new Date();
    return workoutDate.getMonth() === now.getMonth() && workoutDate.getFullYear() === now.getFullYear();
  }).length;


  const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const todayCalories = workouts.filter(w => {
    const workoutDate = new Date(w.completedAt || w.createdAt);
    const today = new Date();
    return workoutDate.toDateString() === today.toDateString();
  }).reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);



  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <MetricCard
        title="Calorias Queimadas"
        value={todayCalories.toString()}
        subtitle={`Total: ${totalCalories}`}
        icon={<Flame size={20} />}
        trend={todayCalories > 0 ? "up" : "neutral"}
      />

      <MetricCard
        title="Treinos Concluídos"
        value={thisMonthWorkouts.toString()}
        subtitle="Este mês"
        icon={<Target size={20} />}
        trend={thisMonthWorkouts > 0 ? "up" : "neutral"}
      />


    </div>
  );
};