import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Moon, Dumbbell, TrendingUp, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useWellnessCheckin } from '@/hooks/useWellnessCheckin';
import './ReadinessDashboard.css';

interface ReadinessDashboardProps {
    compact?: boolean;
    onCheckIn?: () => void;
}

export const ReadinessDashboard: React.FC<ReadinessDashboardProps> = ({
    compact = false,
    onCheckIn
}) => {
    const { todayCheckin, readinessLevel, readinessScore, needsCheckin, readinessMessage, tableExists } = useWellnessCheckin();

    // Don't render if COD System tables are not migrated
    if (!tableExists) {
        return null;
    }

    const getStatusConfig = (level: string | null) => {
        switch (level) {
            case 'green':
                return {
                    color: '#22c55e',
                    bgColor: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    icon: <CheckCircle className="w-5 h-5" />,
                    title: 'Alta Prontidão',
                    emoji: '🟢',
                    advice: 'Treino completo liberado!'
                };
            case 'yellow':
                return {
                    color: '#f59e0b',
                    bgColor: 'rgba(245, 158, 11, 0.1)',
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                    icon: <AlertTriangle className="w-5 h-5" />,
                    title: 'Prontidão Moderada',
                    emoji: '🟡',
                    advice: 'Treino adaptado: -15% volume'
                };
            case 'red':
                return {
                    color: '#ef4444',
                    bgColor: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    icon: <AlertCircle className="w-5 h-5" />,
                    title: 'Baixa Prontidão',
                    emoji: '🔴',
                    advice: 'Foco em recuperação'
                };
            default:
                return {
                    color: '#6b7280',
                    bgColor: 'rgba(107, 114, 128, 0.1)',
                    borderColor: 'rgba(107, 114, 128, 0.3)',
                    icon: <Zap className="w-5 h-5" />,
                    title: 'Não avaliado',
                    emoji: '⚪',
                    advice: 'Faça o check-in'
                };
        }
    };

    const config = getStatusConfig(readinessLevel);

    if (compact) {
        return (
            <div
                className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer"
                style={{
                    backgroundColor: config.bgColor,
                    borderColor: config.borderColor
                }}
                onClick={needsCheckin ? onCheckIn : undefined}
            >
                <span className="text-2xl">{config.emoji}</span>
                <div className="flex-1">
                    <span className="font-semibold text-sm" style={{ color: config.color }}>
                        {config.title}
                    </span>
                    {readinessScore && (
                        <span className="block text-xs text-gray-400">
                            {readinessScore.toFixed(1)}/10
                        </span>
                    )}
                </div>
                {needsCheckin && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-white">
                        Check-in
                    </span>
                )}
            </div>
        );
    }

    if (needsCheckin) {
        return (
            <Card
                className="cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderColor: 'rgba(99, 102, 241, 0.3)'
                }}
                onClick={onCheckIn}
            >
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-white">Prontidão do Dia</h3>
                    </div>
                    <div className="text-center py-4">
                        <p className="text-gray-400 mb-4 text-sm">
                            Complete seu check-in de wellness para liberar o treino adaptado de hoje.
                        </p>
                        <button className="bg-gradient-to-r from-primary to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                            Fazer Check-in
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            style={{
                backgroundColor: config.bgColor,
                borderColor: config.borderColor
            }}
        >
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-white">Prontidão do Dia</h3>
                </div>

                {/* Main Display */}
                <div className="flex items-center gap-4 mb-4">
                    <div
                        className="w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center shrink-0"
                        style={{
                            backgroundColor: config.bgColor,
                            borderColor: config.color
                        }}
                    >
                        <span className="text-2xl mb-1">{config.emoji}</span>
                        <span
                            className="text-xl font-bold"
                            style={{ color: config.color }}
                        >
                            {readinessScore?.toFixed(1)}
                        </span>
                    </div>

                    <div className="flex-1">
                        <h4 className="font-bold text-lg" style={{ color: config.color }}>
                            {config.title}
                        </h4>
                        <p className="text-sm text-gray-400">{config.advice}</p>
                        {readinessMessage && (
                            <p className="text-xs text-gray-500 mt-1 italic">{readinessMessage}</p>
                        )}
                    </div>
                </div>

                {/* Metrics */}
                {todayCheckin && (
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
                        <div className="text-center">
                            <Moon className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                            <span className="block text-lg font-bold text-white">
                                {todayCheckin.sleep_quality}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                Sono
                            </span>
                        </div>
                        <div className="text-center">
                            <Dumbbell className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                            <span className="block text-lg font-bold text-white">
                                {10 - todayCheckin.muscle_soreness}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                Recuperação
                            </span>
                        </div>
                        <div className="text-center">
                            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                            <span className="block text-lg font-bold text-white">
                                {todayCheckin.energy_level}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                Energia
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ReadinessDashboard;
