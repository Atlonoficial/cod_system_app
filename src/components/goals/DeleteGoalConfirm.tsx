import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserGoal, useGoals } from "@/hooks/useGoals";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteGoalConfirmProps {
    goal: UserGoal;
    trigger?: React.ReactNode;
}

export const DeleteGoalConfirm = ({ goal, trigger }: DeleteGoalConfirmProps) => {
    const { deleteGoal } = useGoals();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        const success = await deleteGoal(goal.id);
        setLoading(false);

        if (success) {
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 size={16} />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" aria-describedby="delete-goal-description">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle size={20} />
                        Cancelar Meta?
                    </DialogTitle>
                    <p id="delete-goal-description" className="text-sm text-muted-foreground">
                        Esta ação irá cancelar a meta. O progresso será mantido no histórico.
                    </p>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Preview da meta */}
                    <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                        <h4 className="font-medium text-foreground">{goal.title}</h4>
                        {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span className="px-2 py-0.5 bg-muted rounded-full">{goal.category}</span>
                            <span>•</span>
                            <span>{goal.current_value} / {goal.target_value} {goal.target_unit}</span>
                        </div>
                    </div>

                    {/* Aviso */}
                    <div className="bg-warning/10 border border-warning/30 p-3 rounded-lg">
                        <p className="text-sm text-warning-foreground">
                            ⚠️ A meta será marcada como cancelada. Você pode criar uma nova meta se desejar recomeçar.
                        </p>
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Manter Meta
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ? 'Cancelando...' : 'Sim, Cancelar Meta'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
