import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Dumbbell, Activity, CheckCircle2 } from 'lucide-react';

export interface CheckoutData {
    overallRpe: number;
    workoutFeeling: 'terrible' | 'bad' | 'ok' | 'good' | 'amazing';
    notes?: string;
}

export interface WorkoutStats {
    duration: number;
    totalVolume: number;
    averageRpe: number;
    exercisesCompleted: number;
    totalExercises: number;
}

interface PostWorkoutCheckoutProps {
    isOpen: boolean;
    onComplete: (data: CheckoutData) => void;
    workoutStats: WorkoutStats;
    isSaving?: boolean;
}

const FEELINGS = [
    { value: 'terrible' as const, emoji: '😫', label: 'Péssimo' },
    { value: 'bad' as const, emoji: '😕', label: 'Ruim' },
    { value: 'ok' as const, emoji: '😐', label: 'Ok' },
    { value: 'good' as const, emoji: '🙂', label: 'Bom' },
    { value: 'amazing' as const, emoji: '🤩', label: 'Incrível' },
];

const RPE_LABELS = [
    { value: 1, label: 'Muito Fácil', color: 'text-emerald-400' },
    { value: 2, label: 'Fácil', color: 'text-emerald-400' },
    { value: 3, label: 'Moderado', color: 'text-blue-400' },
    { value: 4, label: 'Moderado', color: 'text-blue-400' },
    { value: 5, label: 'Desafiador', color: 'text-amber-400' },
    { value: 6, label: 'Desafiador', color: 'text-amber-400' },
    { value: 7, label: 'Difícil', color: 'text-orange-400' },
    { value: 8, label: 'Muito Difícil', color: 'text-orange-400' },
    { value: 9, label: 'Extremo', color: 'text-red-400' },
    { value: 10, label: 'Máximo', color: 'text-red-400' },
];

export const PostWorkoutCheckout: React.FC<PostWorkoutCheckoutProps> = ({
    isOpen,
    onComplete,
    workoutStats,
    isSaving = false
}) => {
    const [overallRpe, setOverallRpe] = useState<number>(Math.round(workoutStats.averageRpe) || 7);
    const [workoutFeeling, setWorkoutFeeling] = useState<CheckoutData['workoutFeeling']>('good');
    const [notes, setNotes] = useState('');

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleComplete = () => {
        onComplete({
            overallRpe,
            workoutFeeling,
            notes: notes.trim() || undefined
        });
    };

    const currentRpeLabel = RPE_LABELS[overallRpe - 1];

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="max-w-md mx-4 p-0 gap-0 bg-background border-border/50">
                <DialogTitle className="sr-only">Checkout do Treino</DialogTitle>

                {/* Minimalist Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">
                                Treino Finalizado
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Como foi sua sessão?
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Compact Stats */}
                    <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                            <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                            <p className="text-sm font-semibold text-foreground">{formatTime(workoutStats.duration)}</p>
                            <p className="text-[10px] text-muted-foreground">Tempo</p>
                        </div>

                        <div className="text-center p-2 rounded-lg bg-muted/30">
                            <Dumbbell className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                            <p className="text-sm font-semibold text-foreground">{workoutStats.totalVolume}kg</p>
                            <p className="text-[10px] text-muted-foreground">Volume</p>
                        </div>

                        <div className="text-center p-2 rounded-lg bg-muted/30">
                            <Activity className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                            <p className="text-sm font-semibold text-foreground">
                                {workoutStats.exercisesCompleted}/{workoutStats.totalExercises}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Exerc.</p>
                        </div>

                        <div className="text-center p-2 rounded-lg bg-muted/30">
                            <Activity className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                            <p className="text-sm font-semibold text-foreground">{workoutStats.averageRpe.toFixed(1)}</p>
                            <p className="text-[10px] text-muted-foreground">RPE Méd</p>
                        </div>
                    </div>

                    {/* Feeling Selection - Minimalist */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Sentimento geral
                        </label>
                        <div className="flex gap-2">
                            {FEELINGS.map((feeling) => (
                                <button
                                    key={feeling.value}
                                    onClick={() => setWorkoutFeeling(feeling.value)}
                                    className={`flex-1 p-2.5 rounded-lg border transition-all ${workoutFeeling === feeling.value
                                        ? 'border-primary bg-primary/5 scale-105'
                                        : 'border-border/50 hover:border-primary/30'
                                        }`}
                                >
                                    <span className="text-xl block">{feeling.emoji}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RPE Slider - iOS Compatible */}
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <label className="text-sm font-medium text-foreground">
                                RPE Geral
                            </label>
                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-2xl font-bold ${currentRpeLabel.color}`}>
                                    {overallRpe}
                                </span>
                                <span className={`text-sm ${currentRpeLabel.color}`}>
                                    {currentRpeLabel.label}
                                </span>
                            </div>
                        </div>
                        {/* BUILD 58: touch-action inline for mobile slider support */}
                        <div className="py-2" style={{ touchAction: 'none' }}>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="1"
                                value={overallRpe}
                                onChange={(e) => setOverallRpe(parseInt(e.target.value))}
                                className="rpe-slider"
                                style={{ touchAction: 'none', WebkitAppearance: 'none' }}
                                aria-label="RPE slider"
                                title="Ajuste o RPE de 1 a 10"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>Fácil</span>
                            <span>Moderado</span>
                            <span>Máximo</span>
                        </div>

                    </div>

                    {/* Notes - Minimal */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Observações
                        </label>
                        <Textarea
                            placeholder="Adicione notas sobre o treino (opcional)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[70px] resize-none text-sm"
                            maxLength={300}
                        />
                    </div>

                    {/* Clean Finish Button */}
                    <Button
                        onClick={handleComplete}
                        disabled={isSaving}
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
                    >
                        {isSaving ? 'Salvando...' : 'Concluir Treino'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PostWorkoutCheckout;
