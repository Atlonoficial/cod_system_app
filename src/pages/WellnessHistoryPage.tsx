import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Activity,
    Moon,
    Clock,
    Dumbbell,
    Brain,
    Zap,
    TrendingUp,
    TrendingDown,
    Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface WellnessRecord {
    id: string;
    sleep_quality: number;
    sleep_hours: number;
    muscle_soreness: number;
    stress_level: number;
    energy_level: number;
    readiness_score: number;
    readiness_level: 'green' | 'yellow' | 'red';
    checkin_date: string;
}

type PeriodFilter = '7' | '30' | '90';

export const WellnessHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [records, setRecords] = useState<WellnessRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<PeriodFilter>('7');

    const fetchWellnessHistory = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(period));

            const { data, error } = await supabase
                .from('wellness_checkins')
                .select('*')
                .eq('student_id', user.id)
                .gte('checkin_date', startDate.toISOString().split('T')[0])
                .order('checkin_date', { ascending: false });

            if (error) {
                console.error('[WellnessHistory] Error:', error);
                return;
            }

            setRecords(data as WellnessRecord[] || []);
        } catch (err) {
            console.error('[WellnessHistory] Exception:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, period]);

    useEffect(() => {
        fetchWellnessHistory();
    }, [fetchWellnessHistory]);

    const getReadinessConfig = (level: string) => {
        switch (level) {
            case 'green':
                return { color: 'text-green-500', bg: 'bg-green-500/10', emoji: '🟢', label: 'Alta' };
            case 'yellow':
                return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', emoji: '🟡', label: 'Moderada' };
            case 'red':
                return { color: 'text-red-500', bg: 'bg-red-500/10', emoji: '🔴', label: 'Baixa' };
            default:
                return { color: 'text-gray-500', bg: 'bg-gray-500/10', emoji: '⚪', label: 'N/A' };
        }
    };

    const getAverages = () => {
        if (records.length === 0) return null;

        const sum = records.reduce((acc, r) => ({
            sleep_quality: acc.sleep_quality + r.sleep_quality,
            sleep_hours: acc.sleep_hours + (r.sleep_hours || 0),
            muscle_soreness: acc.muscle_soreness + r.muscle_soreness,
            stress_level: acc.stress_level + r.stress_level,
            energy_level: acc.energy_level + r.energy_level,
            readiness_score: acc.readiness_score + r.readiness_score
        }), {
            sleep_quality: 0,
            sleep_hours: 0,
            muscle_soreness: 0,
            stress_level: 0,
            energy_level: 0,
            readiness_score: 0
        });

        const count = records.length;
        return {
            sleep_quality: (sum.sleep_quality / count).toFixed(1),
            sleep_hours: (sum.sleep_hours / count).toFixed(1),
            muscle_soreness: (sum.muscle_soreness / count).toFixed(1),
            stress_level: (sum.stress_level / count).toFixed(1),
            energy_level: (sum.energy_level / count).toFixed(1),
            readiness_score: (sum.readiness_score / count).toFixed(1)
        };
    };

    const chartData = records
        .slice()
        .reverse()
        .map(r => ({
            date: new Date(r.checkin_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            score: r.readiness_score,
            sono: r.sleep_quality,
            energia: r.energy_level
        }));

    const averages = getAverages();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center gap-4 p-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">Histórico de Bem-Estar</h1>
                        <p className="text-sm text-muted-foreground">
                            {records.length} check-ins registrados
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Period Filter */}
                <div className="flex gap-2">
                    {(['7', '30', '90'] as PeriodFilter[]).map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPeriod(p)}
                        >
                            {p === '7' ? '7 dias' : p === '30' ? '30 dias' : '90 dias'}
                        </Button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-4">
                                    <div className="h-20 bg-muted rounded"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : records.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                            <p className="text-muted-foreground">
                                Nenhum check-in registrado nos últimos {period} dias
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Faça seu primeiro check-in ao abrir o app!
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Averages Summary */}
                        {averages && (
                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        Médias do Período
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-primary">
                                                {averages.readiness_score}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Prontidão</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold">
                                                {averages.sleep_hours}h
                                            </p>
                                            <p className="text-xs text-muted-foreground">Sono</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold">
                                                {averages.energy_level}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Energia</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Chart */}
                        {chartData.length > 1 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Evolução da Prontidão
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                <XAxis
                                                    dataKey="date"
                                                    fontSize={10}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    domain={[0, 10]}
                                                    fontSize={10}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="hsl(var(--primary))"
                                                    strokeWidth={2}
                                                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                                                    name="Prontidão"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Records List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Histórico Detalhado
                            </h3>
                            {records.map((record) => {
                                const config = getReadinessConfig(record.readiness_level);
                                const date = new Date(record.checkin_date);

                                return (
                                    <Card key={record.id} className={config.bg}>
                                        <CardContent className="p-4">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{config.emoji}</span>
                                                    <div>
                                                        <p className="font-medium">
                                                            {date.toLocaleDateString('pt-BR', {
                                                                weekday: 'long',
                                                                day: 'numeric',
                                                                month: 'short'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-2xl font-bold ${config.color}`}>
                                                        {record.readiness_score?.toFixed(1)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Prontidão {config.label}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                                <div>
                                                    <Moon className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                                                    <p className="font-medium">{record.sleep_quality}</p>
                                                    <p className="text-muted-foreground">Sono</p>
                                                </div>
                                                <div>
                                                    <Clock className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                                                    <p className="font-medium">{record.sleep_hours || '-'}h</p>
                                                    <p className="text-muted-foreground">Horas</p>
                                                </div>
                                                <div>
                                                    <Dumbbell className="w-4 h-4 mx-auto mb-1 text-red-400" />
                                                    <p className="font-medium">{record.muscle_soreness}</p>
                                                    <p className="text-muted-foreground">Dor</p>
                                                </div>
                                                <div>
                                                    <Brain className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                                                    <p className="font-medium">{record.stress_level}</p>
                                                    <p className="text-muted-foreground">Estresse</p>
                                                </div>
                                                <div>
                                                    <Zap className="w-4 h-4 mx-auto mb-1 text-green-400" />
                                                    <p className="font-medium">{record.energy_level}</p>
                                                    <p className="text-muted-foreground">Energia</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default WellnessHistoryPage;
