import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useWeightProgress } from '@/hooks/useWeightProgress';
import { useAuthContext } from '@/components/auth/AuthProvider';

interface WeightChartProps {
  onWeightNeeded?: () => void;
}

export const WeightChart = ({ onWeightNeeded }: WeightChartProps) => {
  const { user } = useAuthContext();
  const { weightData, loading, error } = useWeightProgress(user?.id || '');

  console.log('📊 WeightChart render - data:', weightData, 'loading:', loading, 'error:', error);

  // Format data with improved date display
  const chartData = weightData.map(entry => {
    const entryDate = new Date(entry.rawDate);
    const dayOfWeek = entryDate.toLocaleDateString('pt-BR', { weekday: 'short' });
    const dayMonth = entryDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });

    return {
      ...entry,
      date: `${dayOfWeek} ${dayMonth}`, // Ex: "Sex 27/10"
      isFriday: entryDate.getDay() === 5
    };
  });

  const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : 0;
  const previousWeight = chartData.length > 1 ? chartData[chartData.length - 2].weight : 0;
  const weightDiff = currentWeight - previousWeight;

  // Custom label renderer for weight values on top of bars
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 3}
        fill="hsl(var(--primary))"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
      >
        {value}kg
      </text>
    );
  };

  if (loading) {
    return (
      <div className="card-gradient p-6 mb-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 bg-muted rounded mb-2 w-32"></div>
            <div className="h-4 bg-muted rounded w-20"></div>
          </div>
          <div className="text-right">
            <div className="h-8 bg-muted rounded mb-1 w-16"></div>
            <div className="h-4 bg-muted rounded w-24"></div>
          </div>
        </div>
        <div className="h-40 bg-muted rounded"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card-gradient p-4 sm:p-6 mb-6 text-center">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Evolução do Peso</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Registre seu peso todas as sextas-feiras para ver sua evolução!
        </p>
        <button
          onClick={onWeightNeeded}
          className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2"
        >
          Registrar Primeiro Peso
        </button>
      </div>
    );
  }
  return (
    <div className="card-gradient p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Evolução do Peso</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Mês atual - {chartData.length} registros</p>
        </div>
        <div className="text-right">
          <p className="text-xl sm:text-2xl font-bold text-primary">{currentWeight}kg</p>
          {previousWeight > 0 && (
            <p className={`text-xs sm:text-sm ${weightDiff <= 0 ? 'text-success' : 'text-warning'}`}>
              {weightDiff <= 0 ? weightDiff.toFixed(1) : `+${weightDiff.toFixed(1)}`}kg vs anterior
            </p>
          )}
        </div>
      </div>

      <div className="h-32 sm:h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
            maxBarSize={window.innerWidth < 640 ? 32 : 40}
            barCategoryGap="20%"
          >
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              interval={0}
            />
            <YAxis hide />
            <Bar
              dataKey="weight"
              radius={[6, 6, 0, 0]}
              minPointSize={2}
            >
              <LabelList content={renderCustomLabel} />
              {chartData.map((entry, index) => {
                const isLatest = index === chartData.length - 1;
                const isFriday = entry.isFriday;

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      isLatest
                        ? 'hsl(var(--primary))' // Último registro - azul primário
                        : isFriday
                          ? 'hsl(var(--secondary))' // Sexta - verde secundário
                          : 'hsl(var(--secondary) / 0.6)' // Outros dias - verde mais suave
                    }
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};