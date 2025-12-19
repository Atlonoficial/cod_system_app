/**
 * COD System - Phase 2: Contextual Chat Hook
 * 
 * Provides contextual help for exercises during workout execution.
 * Allows students to ask questions about specific exercises they're doing.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

export interface ExerciseQuestion {
    id: string;
    exercise_name: string;
    question: string;
    answer: string | null;
    created_at: string;
    answered_at: string | null;
    answered_by: string | null;
}

export interface UseContextualChatResult {
    questions: ExerciseQuestion[];
    loading: boolean;
    submitting: boolean;
    error: string | null;

    // Actions
    askQuestion: (exerciseName: string, question: string) => Promise<boolean>;
    fetchQuestions: (exerciseName?: string) => Promise<void>;

    // For teachers
    answerQuestion: (questionId: string, answer: string) => Promise<boolean>;
}

export const useContextualChat = (): UseContextualChatResult => {
    const { user } = useAuthContext();
    const [questions, setQuestions] = useState<ExerciseQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch questions for a specific exercise or all
    const fetchQuestions = useCallback(async (exerciseName?: string) => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('exercise_questions')
                .select('*')
                .eq('student_id', user.id)
                .order('created_at', { ascending: false });

            if (exerciseName) {
                query = query.eq('exercise_name', exerciseName);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                // Table doesn't exist yet - gracefully handle
                if (fetchError.code === '42P01') {
                    console.log('[ContextualChat] Table not found - feature not yet available');
                    setQuestions([]);
                    return;
                }
                throw fetchError;
            }

            setQuestions((data as ExerciseQuestion[]) || []);
        } catch (err: any) {
            console.error('[ContextualChat] Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Ask a question about an exercise
    const askQuestion = useCallback(async (exerciseName: string, question: string): Promise<boolean> => {
        if (!user?.id) return false;

        try {
            setSubmitting(true);
            setError(null);

            const { error: insertError } = await supabase
                .from('exercise_questions')
                .insert({
                    student_id: user.id,
                    exercise_name: exerciseName,
                    question: question
                });

            if (insertError) {
                if (insertError.code === '42P01') {
                    setError('Funcionalidade não disponível - tabela não existe');
                    return false;
                }
                throw insertError;
            }

            // Refresh questions
            await fetchQuestions(exerciseName);
            return true;
        } catch (err: any) {
            console.error('[ContextualChat] Error asking question:', err);
            setError(err.message);
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [user?.id, fetchQuestions]);

    // Answer a question (for teachers)
    const answerQuestion = useCallback(async (questionId: string, answer: string): Promise<boolean> => {
        if (!user?.id) return false;

        try {
            setSubmitting(true);
            setError(null);

            const { error: updateError } = await supabase
                .from('exercise_questions')
                .update({
                    answer: answer,
                    answered_at: new Date().toISOString(),
                    answered_by: user.id
                })
                .eq('id', questionId);

            if (updateError) throw updateError;

            // Refresh questions
            await fetchQuestions();
            return true;
        } catch (err: any) {
            console.error('[ContextualChat] Error answering question:', err);
            setError(err.message);
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [user?.id, fetchQuestions]);

    return {
        questions,
        loading,
        submitting,
        error,
        askQuestion,
        fetchQuestions,
        answerQuestion
    };
};

export default useContextualChat;
