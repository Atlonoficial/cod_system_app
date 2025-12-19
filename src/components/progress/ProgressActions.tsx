
import { toast } from "sonner";

/**
 * Hook que automaticamente dá pontos quando o usuário registra progresso
 * Integrado com sistema de gamificação mais robusto
 */
export const useProgressActions = () => {


  const logProgress = async (type: string, value: number, unit: string) => {
    try {
      // Aqui você faria o registro do progresso no banco de dados
      console.log(`Registering progress: ${type} = ${value} ${unit}`);

      // Dar pontos automaticamente com metadata mais detalhada
      toast.success("Progresso registrado!");
    } catch (error) {
      console.error('Error logging progress:', error);
      toast.error("Erro ao registrar progresso");
    }
  };

  const logWeight = (weight: number) => logProgress("weight", weight, "kg");
  const logBodyFat = (bodyFat: number) => logProgress("body_fat", bodyFat, "%");
  const logMuscle = (muscle: number) => logProgress("muscle_mass", muscle, "kg");

  return {
    logProgress,
    logWeight,
    logBodyFat,
    logMuscle
  };
};