import { Card, CardContent } from "@/components/ui/card";
import { Activity, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ProfileStats - Estatísticas do Perfil
 * Version: 1.0.0 | Build: 18
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTA: Sistema de pontos removido (não há painel no dashboard professor)
 * Agora exibe apenas: Treinos Concluídos + Dias Ativos
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface ProfileStatsProps {
  sessionsCount: number;
  activeDays: number;
  loading?: boolean;
}

export const ProfileStats = ({ sessionsCount, activeDays, loading = false }: ProfileStatsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Treinos Concluídos</p>
            <p className="text-lg font-semibold text-foreground">{sessionsCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Dias Ativos</p>
            <p className="text-lg font-semibold text-foreground">{activeDays}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};