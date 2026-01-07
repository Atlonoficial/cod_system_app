import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, RotateCcw, Clock, Target, TrendingUp } from 'lucide-react';
import { SavedWorkoutSession } from '@/hooks/useWorkoutSessionPersistence';

interface ResumeWorkoutDialogProps {
    isOpen: boolean;
    session: SavedWorkoutSession | null;
    sessionAge: string;
    onResume: () => void;
    onStartNew: () => void;
}

export const ResumeWorkoutDialog = ({
    isOpen,
    session,
    sessionAge,
    onResume,
    onStartNew
}: ResumeWorkoutDialogProps) => {
    if (!session) return null;

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress
    const exerciseLogsCount = Object.keys(session.exerciseLogs || {}).length;
    const totalSetsCompleted = Object.values(session.exerciseLogs || {}).reduce(
        (sum, logs) => sum + (logs?.length || 0), 0
    );

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 text-center border-b border-border/50">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-1">
                        Treino em Andamento
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Você tem um treino não finalizado
                    </p>
                </div>

                {/* Session Info */}
                <div className="p-6 space-y-4">
                    <Card className="bg-accent/10 border-accent/20">
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-foreground mb-3">
                                {session.workoutName}
                            </h3>

                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="bg-background/50 rounded-lg p-2">
                                    <Clock className="w-4 h-4 mx-auto text-primary mb-1" />
                                    <p className="text-lg font-bold">{formatTime(session.elapsedTime)}</p>
                                    <p className="text-[10px] text-muted-foreground">Tempo</p>
                                </div>
                                <div className="bg-background/50 rounded-lg p-2">
                                    <Target className="w-4 h-4 mx-auto text-accent mb-1" />
                                    <p className="text-lg font-bold">{totalSetsCompleted}</p>
                                    <p className="text-[10px] text-muted-foreground">Séries</p>
                                </div>
                                <div className="bg-background/50 rounded-lg p-2">
                                    <TrendingUp className="w-4 h-4 mx-auto text-green-500 mb-1" />
                                    <p className="text-lg font-bold">{session.totalVolume}kg</p>
                                    <p className="text-[10px] text-muted-foreground">Volume</p>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground text-center mt-3">
                                Exercício {session.currentExerciseIndex + 1} • Série {session.currentSetNumber} • Salvo {sessionAge}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={onResume}
                            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                            <Play className="w-5 h-5 mr-2" />
                            Continuar Treino
                        </Button>

                        <Button
                            variant="outline"
                            onClick={onStartNew}
                            className="w-full h-10 text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Começar do Zero
                        </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        Treinos são mantidos por até 24 horas
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
