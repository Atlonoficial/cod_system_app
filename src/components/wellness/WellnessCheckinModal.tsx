import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Moon, Dumbbell, Zap, Brain, CheckCircle, Smartphone, RefreshCw, Clock } from 'lucide-react';
import { useWellnessCheckin, WellnessInput } from '@/hooks/useWellnessCheckin';
import { useBiometricSync } from '@/hooks/useBiometricSync';
import { useToast } from '@/hooks/use-toast';
import './WellnessCheckinModal.css';

interface WellnessCheckinModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

interface MetricConfig {
    key: keyof WellnessInput;
    label: string;
    icon: React.ReactNode;
    description: string;
    lowLabel: string;
    highLabel: string;
    color: string;
    isHours?: boolean; // Flag para exibição em horas
    min?: number;
    max?: number;
}

const metrics: MetricConfig[] = [
    {
        key: 'sleep_quality',
        label: 'Qualidade do Sono',
        icon: <Moon className="w-8 h-8" />,
        description: 'Como você dormiu na última noite?',
        lowLabel: 'Péssimo',
        highLabel: 'Excelente',
        color: '#6366f1'
    },
    {
        key: 'sleep_hours',
        label: 'Tempo de Sono',
        icon: <Clock className="w-8 h-8" />,
        description: 'Quantas horas você dormiu?',
        lowLabel: '4h ou menos',
        highLabel: '10h ou mais',
        color: '#8b5cf6',
        isHours: true,
        min: 4,
        max: 10
    },
    {
        key: 'muscle_soreness',
        label: 'Dor Muscular',
        icon: <Dumbbell className="w-8 h-8" />,
        description: 'Qual o nível de dor/desconforto muscular?',
        lowLabel: 'Nenhuma',
        highLabel: 'Muito forte',
        color: '#ef4444'
    },
    {
        key: 'stress_level',
        label: 'Estresse',
        icon: <Brain className="w-8 h-8" />,
        description: 'Qual seu nível de estresse hoje?',
        lowLabel: 'Relaxado',
        highLabel: 'Muito estressado',
        color: '#f59e0b'
    },
    {
        key: 'energy_level',
        label: 'Energia',
        icon: <Zap className="w-8 h-8" />,
        description: 'Quanta energia você tem agora?',
        lowLabel: 'Sem energia',
        highLabel: 'Cheio de energia',
        color: '#22c55e'
    }
];

export const WellnessCheckinModal: React.FC<WellnessCheckinModalProps> = ({
    isOpen,
    onComplete
}) => {
    const { submitCheckin, submitting } = useWellnessCheckin();
    const { biometricData, syncHealthData, loading: biometricLoading, getSleepQualityScore } = useBiometricSync();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState(0);
    const [values, setValues] = useState<Partial<WellnessInput>>({
        sleep_quality: 5,
        sleep_hours: 7,
        muscle_soreness: 5,
        stress_level: 5,
        energy_level: 5
    });
    const [biometricSynced, setBiometricSynced] = useState(false);
    const [result, setResult] = useState<{
        score: number;
        level: 'green' | 'yellow' | 'red';
    } | null>(null);

    // Auto-sync biometric data when modal opens (only on native platforms)
    useEffect(() => {
        if (isOpen && !biometricSynced && biometricData.isNativeAvailable) {
            syncHealthData().then(() => {
                setBiometricSynced(true);
            });
        }
    }, [isOpen, biometricSynced, syncHealthData, biometricData.isNativeAvailable]);

    // Auto-populate sleep quality from REAL biometric data only
    useEffect(() => {
        if (biometricData.sleep && biometricSynced) {
            const sleepScore = getSleepQualityScore();
            // Only update if we have real data
            if (sleepScore !== null) {
                setValues(prev => ({
                    ...prev,
                    sleep_quality: sleepScore,
                    sleep_hours: biometricData.sleep.sleepHours || 7
                }));

                // Show toast for real device data
                toast({
                    title: '📱 Dados de Sono Importados',
                    description: `${biometricData.sleep.sleepHours}h de sono detectadas via ${biometricData.sleep.source === 'healthkit' ? 'Apple Health' : 'Google Fit'}`,
                });
            }
        }
    }, [biometricData.sleep, biometricSynced, getSleepQualityScore, toast]);

    const currentMetric = metrics[currentStep];
    const isLastStep = currentStep === metrics.length - 1;
    const showResult = currentStep > metrics.length - 1;

    const handleValueChange = (value: number[]) => {
        setValues(prev => ({
            ...prev,
            [currentMetric.key]: value[0]
        }));
    };

    const handleNext = async () => {
        if (isLastStep) {
            try {
                const checkin = await submitCheckin(values as WellnessInput);
                if (checkin) {
                    setResult({
                        score: checkin.readiness_score,
                        level: checkin.readiness_level
                    });
                    setCurrentStep(currentStep + 1);
                }
            } catch (error) {
                toast({
                    title: 'Erro',
                    description: 'Não foi possível salvar o check-in',
                    variant: 'destructive'
                });
            }
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleComplete = () => {
        setCurrentStep(0);
        setResult(null);
        onComplete();
    };

    const getReadinessColor = (level: string) => {
        switch (level) {
            case 'green': return '#22c55e';
            case 'yellow': return '#f59e0b';
            case 'red': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getReadinessEmoji = (level: string) => {
        switch (level) {
            case 'green': return '🟢';
            case 'yellow': return '🟡';
            case 'red': return '🔴';
            default: return '⚪';
        }
    };

    const getReadinessTitle = (level: string) => {
        switch (level) {
            case 'green': return 'Alta Prontidão';
            case 'yellow': return 'Prontidão Moderada';
            case 'red': return 'Baixa Prontidão';
            default: return 'Prontidão';
        }
    };

    const getReadinessDescription = (level: string) => {
        switch (level) {
            case 'green': return 'Você está pronto para treinar! Vamos com tudo hoje.';
            case 'yellow': return 'Treino adaptado com volume reduzido e mais descanso.';
            case 'red': return 'Foco em recuperação ativa. Cuide do seu corpo!';
            default: return '';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="wellness-modal-content max-w-md mx-auto bg-gradient-to-b from-slate-900 to-slate-800 border-slate-700">
                <DialogTitle className="sr-only">Wellness Check-in</DialogTitle>

                {!showResult ? (
                    <div className="wellness-container p-6">
                        {/* Progress */}
                        <div className="flex justify-center gap-2 mb-8">
                            {metrics.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-3 h-3 rounded-full transition-all ${idx <= currentStep ? 'scale-110' : ''
                                        }`}
                                    style={{
                                        backgroundColor: idx <= currentStep
                                            ? currentMetric.color
                                            : 'rgba(255, 255, 255, 0.2)'
                                    }}
                                />
                            ))}
                        </div>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"
                                style={{ backgroundColor: `${currentMetric.color}20` }}
                            >
                                <span style={{ color: currentMetric.color }}>
                                    {currentMetric.icon}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">
                                {currentMetric.label}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {currentMetric.description}
                            </p>
                        </div>

                        {/* Value Display */}
                        <div className="text-center mb-6">
                            <span
                                className="text-6xl font-bold"
                                style={{ color: currentMetric.color }}
                            >
                                {values[currentMetric.key] || (currentMetric.isHours ? 7 : 5)}
                            </span>
                            <span className="text-2xl text-gray-500">
                                {currentMetric.isHours ? 'h' : '/10'}
                            </span>
                        </div>

                        {/* Slider */}
                        <div className="px-4 mb-8">
                            <Slider
                                min={currentMetric.min || 1}
                                max={currentMetric.max || 10}
                                step={currentMetric.isHours ? 0.5 : 1}
                                value={[values[currentMetric.key] as number || (currentMetric.isHours ? 7 : 5)]}
                                onValueChange={handleValueChange}
                                className="wellness-slider"
                            />
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                <span>{currentMetric.lowLabel}</span>
                                <span>{currentMetric.highLabel}</span>
                            </div>
                        </div>

                        {/* Button */}
                        <Button
                            onClick={handleNext}
                            disabled={submitting}
                            className="w-full py-6 text-lg font-semibold rounded-xl"
                            style={{ backgroundColor: currentMetric.color }}
                        >
                            {submitting ? 'Calculando...' : (isLastStep ? 'Ver Resultado' : 'Próximo')}
                        </Button>

                        {/* Step indicator */}
                        <p className="text-center text-gray-500 text-sm mt-4">
                            {currentStep + 1} de {metrics.length}
                        </p>
                    </div>
                ) : (
                    /* Result Screen */
                    <div className="wellness-result p-6 text-center">
                        <div
                            className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in"
                            style={{ backgroundColor: `${getReadinessColor(result?.level || '')}20` }}
                        >
                            <span className="text-5xl">
                                {getReadinessEmoji(result?.level || '')}
                            </span>
                        </div>

                        <h2
                            className="text-2xl font-bold mb-4"
                            style={{ color: getReadinessColor(result?.level || '') }}
                        >
                            {getReadinessTitle(result?.level || '')}
                        </h2>

                        <div className="flex items-baseline justify-center mb-4">
                            <span className="text-6xl font-bold text-white">
                                {result?.score?.toFixed(1)}
                            </span>
                            <span className="text-2xl text-gray-500">/10</span>
                        </div>

                        <p className="text-gray-300 mb-8 max-w-xs mx-auto">
                            {getReadinessDescription(result?.level || '')}
                        </p>

                        <Button
                            onClick={handleComplete}
                            className="w-full py-6 text-lg font-semibold rounded-xl"
                            style={{ backgroundColor: getReadinessColor(result?.level || '') }}
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Iniciar Treino
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default WellnessCheckinModal;
