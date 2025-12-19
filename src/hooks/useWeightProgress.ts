import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getFridayOfWeek } from '@/utils/dateHelpers';
import { retryWithBackoff } from '@/utils/retryWithBackoff';
import { offlineStorage } from '@/services/offline/offlineStorage';

// ✅ Circuit breaker para peso (impede cascata de falhas)
let weightCircuitOpen = false;
let weightFailureCount = 0;
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_TIMEOUT = 300000; // 5 minutos

interface WeightEntry {
  date: string;
  weight: number;
  weekDay: string;
  rawDate: string;
}

export const useWeightProgress = (userId: string) => {
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeightProgress = async () => {
    if (!userId) {
      setWeightData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ OFFLINE FIRST: Load from local storage immediately
      const cachedWeight = await offlineStorage.get<WeightEntry[]>(`weight_progress_${userId}`);
      if (cachedWeight && cachedWeight.length > 0) {
        console.log('📦 [useWeightProgress] Loaded weight from offline storage');
        setWeightData(cachedWeight);
      }

      if (import.meta.env.DEV) {
        console.log('🔍 Fetching weight progress for user:', userId);
      }

      // ✅ Adicionar retry logic
      const { data, error: fetchError } = await retryWithBackoff(async () => {
        return await supabase
          .from('progress')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'weight')
          .order('date', { ascending: false })
          .limit(5);
      });

      if (fetchError) {
        if (import.meta.env.DEV) {
          console.error('❌ Error fetching weight data:', fetchError);
        }
        // Don't throw if we have cached data
        if (!cachedWeight) throw fetchError;
      }

      if (data) {
        if (import.meta.env.DEV) {
          console.log('📊 Raw weight data from DB:', data);
        }

        // Format data for the chart - current month only
        const formattedData = data.map(entry => {
          const entryDate = new Date(entry.date);
          return {
            date: entryDate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short'
            }),
            weight: Number(entry.value),
            weekDay: entryDate.toLocaleDateString('pt-BR', { weekday: 'short' }),
            rawDate: entry.date // Keep original date for calculations
          };
        }).reverse(); // Reverter para mostrar cronologicamente (antigo -> novo)

        console.log('📈 Formatted chart data:', formattedData);

        setWeightData(formattedData);
        // Save to offline storage
        offlineStorage.set(`weight_progress_${userId}`, formattedData).catch(console.error);
      }
    } catch (err) {
      console.error('Error fetching weight progress:', err);
      // Only show error if no data
      if (weightData.length === 0) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar dados de peso');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function that performs the actual weight entry logic
  const performWeightEntry = async (weight: number) => {
    console.log('🔍 Starting weight entry process for userId:', userId);

    const today = new Date();

    // ✅ Salvar o peso no dia ATUAL do registro
    const insertData = {
      user_id: userId,
      type: 'weight',
      value: weight,
      unit: 'kg',
      date: today.toISOString().split('T')[0] // Salva no dia atual
    };

    console.log('💾 Inserting weight entry:', insertData);

    const { data, error: insertError } = await retryWithBackoff(async () => {
      const result = await supabase
        .from('progress')
        .insert(insertData)
        .select()
        .single();
      return result;
    });

    if (insertError) {
      console.error('❌ Supabase insert error:', insertError);
      throw insertError;
    }

    console.log('✅ Weight entry added successfully:', data);

    // Refresh data after adding
    await fetchWeightProgress();
    return true;
  };

  const addWeightEntry = async (weight: number) => {
    if (!userId) {
      console.error('❌ No userId found');
      setError('Usuário não identificado');
      return false;
    }

    try {
      // Try online first
      await performWeightEntry(weight);
      return true;
    } catch (err: any) {
      console.error('❌ Error adding weight entry (trying offline):', err);

      // ✅ OFFLINE FALLBACK
      try {
        await offlineStorage.addAction({
          type: 'LOG_WEIGHT',
          payload: { weight, date: new Date().toISOString() },
          userId
        });

        // Optimistic update
        const today = new Date();
        const newEntry: WeightEntry = {
          date: today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          weight: weight,
          weekDay: today.toLocaleDateString('pt-BR', { weekday: 'short' }),
          rawDate: today.toISOString()
        };

        const newData = [...weightData, newEntry].sort((a, b) =>
          new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
        );

        setWeightData(newData);
        offlineStorage.set(`weight_progress_${userId}`, newData).catch(console.error);

        console.log('✅ Saved weight action to offline queue');
        return true;
      } catch (offlineErr) {
        console.error('Failed to save offline action', offlineErr);
        setError('Erro ao salvar peso. Verifique sua conexão.');
        return false;
      }
    }
  };

  const hasWeighedThisWeek = async () => {
    if (!userId) return false;

    // Check local cache first
    if (weightData.length > 0) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const hasLocal = weightData.some(entry => new Date(entry.rawDate) >= startOfWeek);
      if (hasLocal) return true;
    }

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    try {
      // ✅ Use retry logic for weekly check
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('progress')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'weight')
          .gte('date', startOfWeek.toISOString().split('T')[0])
          .limit(1);
        return result;
      });

      if (error) {
        // If error (offline), assume false unless we found it in cache above
        console.error('Error checking weekly weight:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (err) {
      console.error('Error in hasWeighedThisWeek:', err);
      return false;
    }
  };

  const isFridayToday = () => {
    return new Date().getDay() === 5; // 5 = Friday
  };

  const shouldShowWeightModal = async () => {
    // Simplesmente verificar se já registrou peso esta semana
    // Se não registrou, mostrar modal em qualquer dia
    const alreadyWeighed = await hasWeighedThisWeek();
    return !alreadyWeighed; // Mostrar modal se NÃO pesou essa semana
  };

  const addWeightFromAssessment = async (weight: number, assessmentDate: string) => {
    if (!userId) return false;

    try {
      // Garantir formato ISO completo se a data vier em formato simples
      const formattedDate = assessmentDate.includes('T')
        ? assessmentDate
        : new Date(assessmentDate + 'T00:00:00').toISOString();

      console.log('💾 Adding weight from assessment:', { userId, weight, date: formattedDate });

      const { data, error: insertError } = await supabase
        .from('progress')
        .insert({
          user_id: userId,
          type: 'weight',
          value: weight,
          unit: 'kg',
          date: formattedDate
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error inserting weight from assessment:', insertError);
        throw insertError;
      }

      console.log('✅ Weight entry from assessment added successfully:', data);

      // Refresh data after adding
      await fetchWeightProgress();
      return true;
    } catch (err) {
      console.error('Error adding weight from assessment:', err);
      return false;
    }
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    fetchWeightProgress();
  }, [userId]);

  return {
    weightData,
    loading,
    error,
    addWeightEntry,
    hasWeighedThisWeek,
    isFridayToday,
    shouldShowWeightModal,
    addWeightFromAssessment,
    clearError,
    refetch: fetchWeightProgress
  };
};