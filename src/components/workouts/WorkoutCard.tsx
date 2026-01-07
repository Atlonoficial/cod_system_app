import { Clock, Flame, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WorkoutCardProps {
  name: string;
  duration: number;
  calories: number;
  difficulty: string;
  muscleGroup: string;
  image?: string;
  isCompleted?: boolean;
  onClick?: () => void;
  highlighted?: boolean;
}

export const WorkoutCard = ({
  name,
  duration,
  calories,
  difficulty,
  muscleGroup,
  image,
  isCompleted = false,
  onClick,
  highlighted = false
}: WorkoutCardProps) => {
  // Estado vazio quando não há dados de treino
  if (!name || name.trim() === '') {
    return (
      <Card className="bg-card/30 border-border/30 overflow-hidden rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-primary/60" />
          </div>
          <p className="text-foreground font-medium mb-1">Nenhum treino disponível</p>
          <p className="text-muted-foreground text-sm">Aguardando seu personal trainer configurar seus treinos</p>
        </CardContent>
      </Card>
    );
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Iniciante': return 'text-green-400';
      case 'Intermediário': return 'text-primary';
      case 'Avançado': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card
      className={`relative overflow-hidden group cursor-pointer border-transparent hover:border-sidebar-primary/50 transition-all duration-300 rounded-2xl ${highlighted
        ? 'bg-gradient-to-br from-accent/5 to-card border-accent/30 shadow-[0_0_15px_-3px_rgba(235,255,0,0.15)] scale-[1.01]'
        : 'bg-card/40 hover:bg-card/60 border-border/50'
        }`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-40 object-cover rounded-t-2xl"
            />
          ) : (
            <div className="w-full h-40 rounded-t-2xl bg-gradient-to-r from-primary/30 to-secondary/30" />
          )}

          {/* Completed Badge */}
          {isCompleted && (
            <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[10px] font-semibold text-primary-foreground">Concluído</span>
            </div>
          )}

          {/* Muscle Group Badge */}
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-xl px-3 py-1">
            <span className="text-xs text-foreground font-medium">{muscleGroup}</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-2">{name}</h3>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isNaN(duration) || duration <= 0 ? '-' : `${Math.round(duration)}min`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-muted-foreground">
                {isNaN(calories) || calories <= 0 ? '-' : `${calories} cal`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>

            <button
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-accent text-background hover:bg-accent/90"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              Ver
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};