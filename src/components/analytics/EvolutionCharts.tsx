/**
 * COD System - Phase 2: Workout Evolution Charts
 * 
 * Visualizes the student's training evolution over time:
 * - Volume progress (total kg lifted)
 * - RPE trends
 * - Readiness correlation with performance
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Dumbbell, Activity, Target } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    ComposedChart,
    Bar
} from 'recharts';

interface WorkoutLogData {
    date: string;
    totalVolume: number;
    averageRpe: number;
    readinessScore: number;
    readinessLevel: 'green' | 'yellow' | 'red';
    exerciseCount: number;
    duration: number;
}

interface EvolutionChartsProps {
    data: WorkoutLogData[];
    compact?: boolean;
}

export const EvolutionCharts: React.FC<EvolutionChartsProps> = ({
    data,
    compact = false
}) => {
    // Process data for charts
    const chartData = useMemo(() => {
        return data.map(log => ({
            ...log,
            date: new Date(log.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short'
            }),
            readinessColor: log.readinessLevel === 'green' ? '#22c55e'
                : log.readinessLevel === 'yellow' ? '#f59e0b'
                    : '#ef4444'
        }));
    }, [data]);

    // Calculate stats
    const stats = useMemo(() => {
        if (data.length === 0) return null;

        const recent = data.slice(-7);
        const older = data.slice(-14, -7);

        const avgVolumeRecent = recent.reduce((sum, d) => sum + d.totalVolume, 0) / recent.length || 0;
        const avgVolumeOlder = older.reduce((sum, d) => sum + d.totalVolume, 0) / older.length || 0;
        const volumeChange = avgVolumeOlder > 0
            ? ((avgVolumeRecent - avgVolumeOlder) / avgVolumeOlder * 100)
            : 0;

        const avgRpe = recent.reduce((sum, d) => sum + d.averageRpe, 0) / recent.length || 0;
        const avgReadiness = recent.reduce((sum, d) => sum + d.readinessScore, 0) / recent.length || 0;

        return {
            avgVolumeRecent: Math.round(avgVolumeRecent),
            volumeChange: Math.round(volumeChange * 10) / 10,
            avgRpe: Math.round(avgRpe * 10) / 10,
            avgReadiness: Math.round(avgReadiness * 10) / 10,
            totalWorkouts: data.length,
            greenDays: data.filter(d => d.readinessLevel === 'green').length
        };
    }, [data]);

    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Sem dados de evolução</p>
                    <p className="text-sm mt-2">Complete treinos para ver seu progresso aqui.</p>
                </CardContent>
            </Card>
        );
    }

    if (compact) {
        // Compact view - just a mini sparkline
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Evolução de Volume</span>
                        </div>
                        {stats && (
                            <span className={`text-xs font-bold ${stats.volumeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {stats.volumeChange >= 0 ? '+' : ''}{stats.volumeChange}%
                            </span>
                        )}
                    </div>
                    <div className="h-16">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.slice(-7)}>
                                <defs>
                                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="totalVolume"
                                    stroke="var(--primary)"
                                    fill="url(#volumeGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Evolução do Treino
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {/* Stats Summary */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="text-center p-2 bg-primary/10 rounded-xl">
                        <Dumbbell className="w-4 h-4 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold">{stats?.avgVolumeRecent?.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Vol. Médio (kg)</p>
                    </div>
                    <div className="text-center p-2 bg-accent/10 rounded-xl">
                        <Target className="w-4 h-4 mx-auto mb-1 text-accent" />
                        <p className="text-lg font-bold">{stats?.avgRpe}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">RPE Médio</p>
                    </div>
                    <div className="text-center p-2 bg-green-500/10 rounded-xl">
                        <Activity className="w-4 h-4 mx-auto mb-1 text-green-500" />
                        <p className="text-lg font-bold">{stats?.avgReadiness}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Prontidão</p>
                    </div>
                    <div className="text-center p-2 bg-blue-500/10 rounded-xl">
                        <TrendingUp className={`w-4 h-4 mx-auto mb-1 ${(stats?.volumeChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                            }`} />
                        <p className={`text-lg font-bold ${(stats?.volumeChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                            {(stats?.volumeChange || 0) >= 0 ? '+' : ''}{stats?.volumeChange}%
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">vs Semana Ant.</p>
                    </div>
                </div>

                {/* Charts Tabs */}
                <Tabs defaultValue="volume" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="volume" className="text-xs">Volume</TabsTrigger>
                        <TabsTrigger value="rpe" className="text-xs">RPE</TabsTrigger>
                        <TabsTrigger value="readiness" className="text-xs">Prontidão</TabsTrigger>
                    </TabsList>

                    <TabsContent value="volume" className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="volumeGradientFull" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Volume']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="totalVolume"
                                    stroke="hsl(var(--primary))"
                                    fill="url(#volumeGradientFull)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="rpe" className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    domain={[0, 10]}
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar
                                    dataKey="averageRpe"
                                    fill="hsl(var(--accent))"
                                    radius={[4, 4, 0, 0]}
                                    name="RPE"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="readinessScore"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Prontidão"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="readiness" className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    domain={[0, 10]}
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value: number, name: string) => [
                                        value.toFixed(1),
                                        name === 'readinessScore' ? 'Prontidão' : name
                                    ]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="readinessScore"
                                    stroke="#22c55e"
                                    strokeWidth={3}
                                    dot={(props: any) => {
                                        const { cx, cy, payload } = props;
                                        const color = payload.readinessLevel === 'green' ? '#22c55e'
                                            : payload.readinessLevel === 'yellow' ? '#f59e0b'
                                                : '#ef4444';
                                        return (
                                            <circle
                                                key={`dot-${payload.date}`}
                                                cx={cx}
                                                cy={cy}
                                                r={4}
                                                fill={color}
                                                stroke="white"
                                                strokeWidth={2}
                                            />
                                        );
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </TabsContent>
                </Tabs>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Alta</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span>Moderada</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Baixa</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default EvolutionCharts;
