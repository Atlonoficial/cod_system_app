import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Exercise {
  id: string;
  name: string;
  video_url?: string;
  instructions?: string[] | null;
  description?: string;
}

export const useExerciseVideo = (exerciseName: string) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseName) {
      setExercise(null);
      return;
    }

    const fetchExercise = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Buscando exercício:', exerciseName);

        // Buscar exercício pelo nome exato primeiro
        let { data, error } = await supabase
          .from('exercises')
          .select('id, name, video_url, instructions, description')
          .eq('name', exerciseName)
          .limit(1);

        if (error) throw error;

        // Se não encontrou pelo nome exato, buscar por similaridade
        if (!data || data.length === 0) {
          // Tentar busca por palavras-chave principais
          const normalizedName = exerciseName.toLowerCase();

          let searchTerms = [];
          if (normalizedName.includes('abdominal') || normalizedName === 'abdominais') {
            searchTerms = ['abdominal', 'crunch'];
          } else if (normalizedName.includes('voo reverso') || normalizedName.includes('máquina de voo')) {
            searchTerms = ['voo', 'fly', 'peitoral'];
          } else if (normalizedName.includes('supino')) {
            searchTerms = ['supino', 'press', 'bench'];
          } else if (normalizedName.includes('agachamento')) {
            searchTerms = ['agachamento', 'squat'];
          } else if (normalizedName.includes('flexão')) {
            searchTerms = ['flexão', 'push'];
          } else if (normalizedName.includes('rosca')) {
            searchTerms = ['rosca', 'curl'];
          } else if (normalizedName.includes('remada')) {
            searchTerms = ['remada', 'row'];
          } else if (normalizedName.includes('desenvolvimento')) {
            searchTerms = ['desenvolvimento', 'press', 'shoulder'];
          } else if (normalizedName.includes('prancha')) {
            searchTerms = ['prancha', 'plank'];
          } else if (normalizedName.includes('burpee')) {
            searchTerms = ['burpee', 'burpees'];
          } else {
            // Busca genérica por similaridade
            searchTerms = [exerciseName];
          }

          for (const term of searchTerms) {
            const { data: similarData, error: similarError } = await supabase
              .from('exercises')
              .select('id, name, video_url, instructions, description')
              .ilike('name', `%${term}%`)
              .limit(1);

            if (similarError) throw similarError;

            if (similarData && similarData.length > 0) {
              data = similarData;
              console.log('Exercício encontrado:', similarData[0].name, 'para busca:', exerciseName);
              break;
            }
          }
        }

        setExercise(data && data.length > 0 ? data[0] : null);

        if (!data || data.length === 0) {
          console.warn('Nenhum exercício encontrado para:', exerciseName);
        }
      } catch (err) {
        console.error('Erro ao buscar exercício:', err);
        setError('Erro ao carregar vídeo do exercício');
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [exerciseName]);

  // Convert instructions array to string for display
  const formatInstructions = (): string | undefined => {
    if (!exercise?.instructions) return undefined;

    // Handle array format (current database format)
    if (Array.isArray(exercise.instructions)) {
      return exercise.instructions.join('\n');
    }

    // Handle legacy string format (if any old data exists)
    return exercise.instructions as unknown as string;
  };

  return {
    exercise,
    loading,
    error,
    videoUrl: exercise?.video_url,
    instructions: formatInstructions(),
    description: exercise?.description
  };
};