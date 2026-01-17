import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserGoal, useGoals } from "@/hooks/useGoals";
import { Pencil } from "lucide-react";

const categoryOptions = [
    { value: 'peso', label: 'Peso' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'forca', label: 'Força' },
    { value: 'frequencia', label: 'Frequência' },
    { value: 'general', label: 'Geral' }
];

interface EditGoalDialogProps {
    goal: UserGoal;
    trigger?: React.ReactNode;
}

export const EditGoalDialog = ({ goal, trigger }: EditGoalDialogProps) => {
    const { updateGoal } = useGoals();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || 'general',
        target_value: goal.target_value?.toString() || '0',
        target_unit: goal.target_unit || '',
        target_date: goal.target_date ? goal.target_date.split('T')[0] : ''
    });

    // Resetar form quando modal abrir
    useEffect(() => {
        if (open) {
            setFormData({
                title: goal.title || '',
                description: goal.description || '',
                category: goal.category || 'general',
                target_value: goal.target_value?.toString() || '0',
                target_unit: goal.target_unit || '',
                target_date: goal.target_date ? goal.target_date.split('T')[0] : ''
            });
        }
    }, [open, goal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title) return;

        setLoading(true);

        // Preparar dados com nomes corretos das colunas
        const updateData: Record<string, any> = {
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            target_value: parseFloat(formData.target_value) || 0
        };

        // Mapear nomes corretos
        if (formData.target_unit) {
            updateData.unit = formData.target_unit;
        }
        if (formData.target_date) {
            updateData.deadline = formData.target_date;
        }

        const success = await updateGoal(goal.id, updateData as any);

        setLoading(false);

        if (success) {
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="outline">
                        <Pencil size={16} className="mr-1" />
                        Editar
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" aria-describedby="edit-goal-description">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil size={18} className="text-primary" />
                        Editar Meta
                    </DialogTitle>
                    <p id="edit-goal-description" className="text-sm text-muted-foreground">
                        Ajuste os detalhes da sua meta.
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="edit-title">Título da Meta</Label>
                        <Input
                            id="edit-title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Perder 5kg"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="edit-description">Descrição</Label>
                        <Textarea
                            id="edit-description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descreva sua meta..."
                            rows={2}
                        />
                    </div>

                    <div>
                        <Label htmlFor="edit-category">Categoria</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                {categoryOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="edit-target-value">Meta</Label>
                            <Input
                                id="edit-target-value"
                                type="number"
                                step="0.1"
                                min="0"
                                value={formData.target_value}
                                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-target-unit">Unidade</Label>
                            <Input
                                id="edit-target-unit"
                                value={formData.target_unit}
                                onChange={(e) => setFormData({ ...formData, target_unit: e.target.value })}
                                placeholder="kg, km, etc"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="edit-target-date">Prazo (opcional)</Label>
                        <Input
                            id="edit-target-date"
                            type="date"
                            value={formData.target_date}
                            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
