import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, Zap, Dumbbell, Calendar, Trophy } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";

const categoryOptions = [
  { value: 'peso', label: 'Peso', icon: Target, description: 'Metas de perda ou ganho de peso' },
  { value: 'cardio', label: 'Cardio', icon: Zap, description: 'Resistência cardiovascular' },
  { value: 'forca', label: 'Força', icon: Dumbbell, description: 'Força e musculação' },
  { value: 'frequencia', label: 'Frequência', icon: Calendar, description: 'Frequência de treinos' },
  { value: 'general', label: 'Geral', icon: Trophy, description: 'Outras metas pessoais' }
];

const unitsByCategory = {
  peso: ['kg', 'lbs'],
  cardio: ['km', 'minutos', 'calorias'],
  forca: ['kg', 'reps', 'séries'],
  frequencia: ['treinos', 'dias'],
  general: ['unidades', 'pontos', 'vezes']
};

interface AddGoalDialogProps {
  trigger?: React.ReactNode;
}

export const AddGoalDialog = ({ trigger }: AddGoalDialogProps) => {
  const { createGoal } = useGoals();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general' as const,
    target_value: '',
    target_unit: '',
    target_date: '',
    points_reward: '100'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.target_value) {
      return;
    }

    // BUILD 57: Payload simplificado para evitar erros de schema
    const success = await createGoal({
      title: formData.title,
      description: formData.description || undefined,
      category: formData.category,
      target_type: 'numeric',
      target_value: parseFloat(formData.target_value),
      target_unit: formData.target_unit || undefined,
      current_value: 0,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      target_date: formData.target_date || undefined,
      points_reward: parseInt(formData.points_reward) || 100
    } as any);

    if (success) {
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        category: 'general',
        target_value: '',
        target_unit: '',
        target_date: '',
        points_reward: '100'
      });
    }
  };

  const selectedCategory = categoryOptions.find(cat => cat.value === formData.category);
  const CategoryIcon = selectedCategory?.icon || Trophy;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="btn-primary w-full">
            <Plus size={18} className="mr-2" />
            Adicionar Nova Meta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="goal-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target size={20} className="text-primary" />
            Nova Meta
          </DialogTitle>
          <p id="goal-dialog-description" className="text-sm text-muted-foreground">
            Defina uma nova meta pessoal para acompanhar seu progresso.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título da Meta</Label>
            <Input
              id="title"
              placeholder="Ex: Perder 5kg"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva sua meta em detalhes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as any })}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <CategoryIcon size={16} />
                    {selectedCategory?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-start gap-2">
                        <Icon size={16} className="mt-0.5" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="target_value">Meta</Label>
              <Input
                id="target_value"
                type="number"
                step="0.1"
                placeholder="0"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="target_unit">Unidade</Label>
              <Select value={formData.target_unit} onValueChange={(value) => setFormData({ ...formData, target_unit: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {unitsByCategory[formData.category]?.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="target_date">Prazo (opcional)</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <Label htmlFor="points_reward">Pontos por Conclusão</Label>
            <Input
              id="points_reward"
              type="number"
              value={formData.points_reward}
              onChange={(e) => setFormData({ ...formData, points_reward: e.target.value })}
              min="10"
              step="10"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary">
              Criar Meta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};