import { useState } from 'react';
import { Scale, WifiOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface WeightInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weight: number) => Promise<boolean>;
  error?: string | null;
}

export const WeightInputModal = ({ isOpen, onClose, onSave, error }: WeightInputModalProps) => {
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();

  const handleSave = async () => {
    const weightValue = parseFloat(weight);

    if (!weightValue || weightValue <= 0 || weightValue > 300) {
      toast({
        title: "Peso inválido",
        description: "Por favor, insira um peso válido entre 1 e 300 kg.",
        variant: "destructive"
      });
      return;
    }

    // ✅ Verificar conexão apenas para aviso, não bloquear
    if (!isOnline) {
      toast({
        title: "Modo Offline",
        description: "Seu peso será salvo localmente e sincronizado quando houver conexão.",
      });
    }

    setLoading(true);

    // ✅ Timeout visual aumentado para 30s
    const timeoutId = setTimeout(() => {
      toast({
        title: "Servidor não responde",
        description: "A operação está demorando mais que o esperado. Continue aguardando...",
      });
    }, 30000);

    try {
      const success = await onSave(weightValue);
      clearTimeout(timeoutId);

      if (success) {
        toast({
          title: "Peso registrado!",
          description: `Seu peso de ${weightValue}kg foi salvo com sucesso.`,
        });
        setWeight('');
        onClose();
      } else {
        toast({
          title: "Não foi possível salvar",
          description: error || "Tente novamente mais tarde ou contate o suporte.",
          variant: "destructive"
        });
      }
    } catch (err) {
      clearTimeout(timeoutId);
      toast({
        title: "Erro ao salvar",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Persist dismiss state so modal doesn't show again today
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`weight_modal_dismissed_${today}`, 'true');
    setWeight('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-4 sm:mx-0 sm:max-w-md w-full max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
            <Scale className="w-5 h-5" />
            <span className="text-sm sm:text-base">
              Registrar Peso - {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'short'
              })}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* ✅ Show warning if offline */}
        {!isOnline && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">Você está offline. Conecte-se para salvar seu peso.</p>
          </div>
        )}

        <div className="space-y-4 py-2 sm:py-4">
          <div className="text-center px-2">
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Registre seu peso semanal para acompanhar sua evolução!
            </p>
          </div>

          <div className="space-y-2 px-2">
            <Label htmlFor="weight" className="text-sm">Peso atual (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="Ex: 75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              min="1"
              max="300"
              className="text-center text-base sm:text-lg h-12"
            />
          </div>

          <div className="flex gap-2 pt-2 px-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
              className="flex-1 h-10"
            >
              Pular
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !weight}
              className="flex-1 h-10"
            >
              {loading ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};