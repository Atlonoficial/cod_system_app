import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted relative overflow-hidden",
        // Shimmer effect
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

/**
 * Skeleton para cards de treino na lista
 */
function WorkoutCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 p-4 space-y-3 bg-card/50">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-[140px]" /> {/* Nome do treino */}
          <Skeleton className="h-3 w-[200px]" /> {/* Descrição */}
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" /> {/* Play button */}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-[70px] rounded-full" /> {/* Badge */}
        <Skeleton className="h-6 w-[60px] rounded-full" /> {/* Badge */}
        <Skeleton className="h-6 w-[50px] rounded-full" /> {/* Badge */}
      </div>
    </div>
  );
}

/**
 * Skeleton para cards do Dashboard (Prontidão, Volume, Peso)
 */
function DashboardCardSkeleton({ size = "medium" }: { size?: "small" | "medium" | "large" }) {
  const heights = {
    small: "h-24",
    medium: "h-32",
    large: "h-48"
  };

  return (
    <div className={cn(
      "rounded-2xl border border-border/50 p-4 bg-card/50",
      heights[size]
    )}>
      <div className="space-y-3">
        <Skeleton className="h-5 w-[120px]" /> {/* Título */}
        <Skeleton className="h-16 w-full rounded-xl" /> {/* Conteúdo */}
      </div>
    </div>
  );
}

/**
 * Skeleton para cards do perfil/settings
 */
function ProfileItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50">
      <Skeleton className="h-10 w-10 rounded-full" /> {/* Ícone/Avatar */}
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[100px]" /> {/* Label */}
        <Skeleton className="h-3 w-[150px]" /> {/* Description */}
      </div>
      <Skeleton className="h-5 w-5 rounded" /> {/* Chevron */}
    </div>
  );
}

/**
 * Lista de skeletons com delay escalonado (animação de entrada)
 */
function SkeletonList({
  count = 3,
  type = "workout"
}: {
  count?: number;
  type?: "workout" | "dashboard" | "profile";
}) {
  const SkeletonComponent = {
    workout: WorkoutCardSkeleton,
    dashboard: DashboardCardSkeleton,
    profile: ProfileItemSkeleton
  }[type];

  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="animate-fade-in-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <SkeletonComponent />
        </div>
      ))}
    </div>
  );
}

export {
  Skeleton,
  WorkoutCardSkeleton,
  DashboardCardSkeleton,
  ProfileItemSkeleton,
  SkeletonList
}

