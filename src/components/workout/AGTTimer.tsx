import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import './AGTTimer.css';

interface AGTTimerProps {
    restSeconds: number;
    onComplete: () => void;
    autoStart?: boolean;
    showSkip?: boolean;
}

export const AGTTimer: React.FC<AGTTimerProps> = ({
    restSeconds,
    onComplete,
    autoStart = true,
    showSkip = true
}) => {
    const [timeLeft, setTimeLeft] = useState(restSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Progress percentage
    const progress = ((restSeconds - timeLeft) / restSeconds) * 100;

    // Get color based on time remaining
    const getColor = useCallback(() => {
        const percentage = timeLeft / restSeconds;
        if (percentage > 0.5) return '#22c55e'; // Green
        if (percentage > 0.25) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    }, [timeLeft, restSeconds]);

    // Start/Resume timer
    const start = useCallback(() => {
        if (timeLeft <= 0) return;
        setIsRunning(true);
    }, [timeLeft]);

    // Pause timer
    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    // Reset timer
    const reset = useCallback(() => {
        setTimeLeft(restSeconds);
        setIsRunning(false);
        setIsComplete(false);
    }, [restSeconds]);

    // Skip timer
    const skip = useCallback(() => {
        setTimeLeft(0);
        setIsRunning(false);
        setIsComplete(true);
        onComplete();
    }, [onComplete]);

    // Timer tick
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        setIsComplete(true);
                        // Vibrate on complete
                        if ('vibrate' in navigator) {
                            navigator.vibrate([200, 100, 200]);
                        }
                        onComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, onComplete]);

    // Auto-start if enabled
    useEffect(() => {
        if (autoStart && !isComplete) {
            const timer = setTimeout(() => start(), 500);
            return () => clearTimeout(timer);
        }
    }, [autoStart, isComplete, start]);

    // Reset when restSeconds changes
    useEffect(() => {
        setTimeLeft(restSeconds);
        setIsComplete(false);
    }, [restSeconds]);

    return (
        <div className="flex flex-col items-center p-6">
            {/* Circular Progress */}
            <div className="relative w-48 h-48 mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={getColor()}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(progress / 100) * 283} 283`}
                        className="transition-all duration-300"
                    />
                </svg>

                {/* Time Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="text-5xl font-bold tabular-nums"
                        style={{ color: getColor() }}
                    >
                        {formatTime(timeLeft)}
                    </span>
                    <span className="text-sm text-gray-400 uppercase tracking-wide">
                        {isComplete ? 'Pronto!' : 'Descanso'}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-6">
                {!isComplete ? (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={reset}
                            className="text-gray-400 hover:text-white"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </Button>

                        <Button
                            onClick={isRunning ? pause : start}
                            className="w-16 h-16 rounded-full"
                            style={{ backgroundColor: getColor() }}
                        >
                            {isRunning ? (
                                <Pause className="w-6 h-6" />
                            ) : (
                                <Play className="w-6 h-6 ml-1" />
                            )}
                        </Button>

                        {showSkip && (
                            <Button
                                variant="ghost"
                                onClick={skip}
                                className="text-gray-400 hover:text-white"
                            >
                                Pular
                            </Button>
                        )}
                    </>
                ) : (
                    <Button
                        onClick={onComplete}
                        className="bg-green-500 hover:bg-green-600"
                    >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Próxima Série
                    </Button>
                )}
            </div>

            {/* Linear Progress Bar */}
            <Progress
                value={progress}
                className="w-full max-w-xs"
                style={{ '--progress-color': getColor() } as any}
            />
        </div>
    );
};

export default AGTTimer;
