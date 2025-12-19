import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MinusCircle, PlusCircle, CheckCircle } from 'lucide-react';
import './SetLogger.css';

interface SetLoggerProps {
    setNumber: number;
    totalSets: number;
    targetReps: number;
    previousWeight?: number;
    onComplete: (reps: number, weight: number, rpe: number) => void;
    onCancel?: () => void;
}

const RPE_DESCRIPTIONS: Record<number, string> = {
    1: 'Muito fácil',
    2: 'Fácil',
    3: 'Moderado-',
    4: 'Moderado',
    5: 'Moderado+',
    6: 'Desafiador-',
    7: 'Desafiador',
    8: 'Difícil',
    9: 'Muito difícil',
    10: 'Máximo'
};

const getRPEColor = (rpe: number): string => {
    if (rpe <= 4) return '#22c55e';
    if (rpe <= 6) return '#a3e635';
    if (rpe <= 7) return '#facc15';
    if (rpe <= 8) return '#f97316';
    return '#ef4444';
};

export const SetLogger: React.FC<SetLoggerProps> = ({
    setNumber,
    totalSets,
    targetReps,
    previousWeight = 0,
    onComplete,
    onCancel
}) => {
    const [reps, setReps] = useState<number>(targetReps);
    const [weight, setWeight] = useState<number>(previousWeight);
    const [rpe, setRpe] = useState<number>(7);

    const handleRepsChange = (delta: number) => {
        setReps(prev => Math.max(0, Math.min(99, prev + delta)));
    };

    const handleWeightChange = (delta: number) => {
        setWeight(prev => Math.max(0, parseFloat((prev + delta).toFixed(1))));
    };

    const handleSubmit = () => {
        onComplete(reps, weight, rpe);
    };

    return (
        <div className="p-6 bg-white/5 rounded-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <span className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-purple-500 font-semibold text-sm">
                    Série {setNumber}/{totalSets}
                </span>
                <span className="text-gray-400 text-sm">Alvo: {targetReps} reps</span>
            </div>

            {/* Reps Input */}
            <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2 font-medium">
                    Repetições
                </label>
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRepsChange(-1)}
                        className="text-gray-400 hover:text-white"
                    >
                        <MinusCircle className="w-8 h-8" />
                    </Button>
                    <div className="flex items-baseline gap-1 min-w-[100px] justify-center">
                        <span className="text-5xl font-bold text-white tabular-nums">
                            {reps}
                        </span>
                        <span className="text-lg text-gray-500">reps</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRepsChange(1)}
                        className="text-gray-400 hover:text-white"
                    >
                        <PlusCircle className="w-8 h-8" />
                    </Button>
                </div>
            </div>

            {/* Weight Input */}
            <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2 font-medium">
                    Carga
                </label>
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWeightChange(-2.5)}
                        className="text-gray-400 hover:text-white"
                    >
                        <MinusCircle className="w-8 h-8" />
                    </Button>
                    <div className="flex items-baseline gap-1 min-w-[100px] justify-center">
                        <span className="text-5xl font-bold text-white tabular-nums">
                            {weight}
                        </span>
                        <span className="text-lg text-gray-500">kg</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWeightChange(2.5)}
                        className="text-gray-400 hover:text-white"
                    >
                        <PlusCircle className="w-8 h-8" />
                    </Button>
                </div>
                {/* Quick Weight Adjust */}
                <div className="flex justify-center gap-2 mt-3">
                    {[-5, -2.5, 2.5, 5].map(delta => (
                        <Button
                            key={delta}
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeightChange(delta)}
                            className="min-w-[50px] text-xs border-white/20 text-gray-300"
                        >
                            {delta > 0 ? '+' : ''}{delta}
                        </Button>
                    ))}
                </div>
            </div>

            {/* RPE Input */}
            <div className="mb-6 p-4 bg-black/20 rounded-xl">
                <label className="block text-gray-400 text-sm mb-3 font-medium">
                    RPE (Esforço Percebido)
                </label>
                <div className="text-center mb-4">
                    <span
                        className="text-6xl font-bold transition-colors"
                        style={{ color: getRPEColor(rpe) }}
                    >
                        {rpe}
                    </span>
                    <span
                        className="block text-sm mt-1 transition-colors"
                        style={{ color: getRPEColor(rpe) }}
                    >
                        {RPE_DESCRIPTIONS[rpe]}
                    </span>
                </div>
                <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[rpe]}
                    onValueChange={(value) => setRpe(value[0])}
                    className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Fácil</span>
                    <span>Máximo</span>
                </div>
            </div>

            {/* Volume Preview */}
            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20 mb-4">
                <span className="text-gray-400 text-sm">Volume desta série:</span>
                <span className="text-xl font-bold text-primary">
                    {(reps * weight).toFixed(1)} kg
                </span>
            </div>

            {/* Submit Button */}
            <Button
                onClick={handleSubmit}
                className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl"
            >
                <CheckCircle className="w-5 h-5 mr-2" />
                Registrar Série
            </Button>
        </div>
    );
};

export default SetLogger;
