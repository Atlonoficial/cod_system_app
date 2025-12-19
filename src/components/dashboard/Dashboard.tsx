import { Bell, Settings, Calendar, Trophy, MessageSquare } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { WeightChart } from "./WeightChart";
import { WeightInputModal } from "./WeightInputModal";

import { QuickActions } from "./QuickActions";
import { DashboardStats } from "./DashboardStats";

import { MetricCard } from "@/components/ui/MetricCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useCurrentWorkoutSession } from "@/hooks/useCurrentWorkoutSession";
import { useOptimizedAvatar } from "@/hooks/useOptimizedAvatar";

// Notification system removed - deprecated
import { useWeightProgress } from "@/hooks/useWeightProgress";
import { useProgressActions } from "@/components/progress/ProgressActions";
import { useWeeklyFeedback } from "@/hooks/useWeeklyFeedback";
import { WeeklyFeedbackModal } from "@/components/feedback/WeeklyFeedbackModal";

// COD System Wellness Components
import { ReadinessDashboard } from "@/components/wellness/ReadinessDashboard";
import { WellnessCheckinModal } from "@/components/wellness/WellnessCheckinModal";
import { useWellnessCheckin } from "@/hooks/useWellnessCheckin";
import "@/components/wellness/ReadinessDashboard.css";

// COD System Phase 2 - Evolution Analytics
import { EvolutionCharts } from "@/components/analytics/EvolutionCharts";
import { useWorkoutEvolution } from "@/hooks/useWorkoutEvolution";

interface DashboardProps {

  onWorkoutClick?: () => void;
}

export const Dashboard = ({ onWorkoutClick }: DashboardProps) => {
  const { userProfile, user, isAuthenticated } = useAuthContext();
  const { avatarUrl, avatarFallback } = useOptimizedAvatar();
  const progressActions = useProgressActions();
  const { logWeight } = progressActions;
  const navigate = useNavigate();
  const [showWeightModal, setShowWeightModal] = useState(false);
  const { addWeightEntry, shouldShowWeightModal, error: weightError, clearError } = useWeightProgress(user?.id || '');

  // COD System - Wellness Check-in (gracefully degrades if tables don't exist)
  const { needsCheckin, readinessLevel, tableExists: codTablesExist } = useWellnessCheckin();
  const [showWellnessModal, setShowWellnessModal] = useState(false);

  // COD System Phase 2 - Workout Evolution Data
  const { chartData: evolutionChartData } = useWorkoutEvolution(30);

  // Weekly feedback hook
  const {
    shouldShowModal: shouldShowFeedbackModal,
    setShouldShowModal: setShouldShowFeedbackModal,
    submitWeeklyFeedback,
    loading: feedbackLoading,
    feedbackSettings,
    teacherId: feedbackTeacherId,
    hasActiveSubscription: feedbackHasActiveSub
  } = useWeeklyFeedback();

  // ETAPA 3: Feedback system monitoring removed (BUILD 35)

  const rawName = userProfile?.name || (user?.user_metadata as any)?.name || '';
  const firstName = typeof rawName === 'string' && rawName.trim() && !rawName.includes('@')
    ? rawName.split(' ')[0]
    : 'Usuário';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Check if should show weight modal (only once per session, only if not weighed this week)
  const weightModalShownRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (weightModalShownRef.current) return; // Already shown this session

    // Show modal only if user hasn't weighed this week
    const checkWeightModal = async () => {
      const today = new Date().toISOString().split('T')[0];
      const dismissedKey = `weight_modal_dismissed_${today}`;
      const wasDismissed = localStorage.getItem(dismissedKey);

      if (wasDismissed === 'true') {
        return;
      }

      const shouldShow = await shouldShowWeightModal();
      if (shouldShow && !weightModalShownRef.current) {
        weightModalShownRef.current = true; // Mark as shown
        setTimeout(() => setShowWeightModal(true), 2000);
      }
    };

    checkWeightModal();
  }, [isAuthenticated, user?.id]); // Only depend on user.id, not the function

  // Check if should show feedback modal (after weight modal logic)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // NÃO sobrescrever se já foi enviado hoje
    const today = new Date().toISOString().split('T')[0];
    const feedbackKey = `feedback_sent_${user.id}_${today}`;
    const wasSentToday = localStorage.getItem(feedbackKey);

    if (wasSentToday === 'true') {
      return;
    }

    // Show feedback modal with delay if needed (after weight modal would show)
    if (shouldShowFeedbackModal) {
      const delay = shouldShowWeightModal ? 4000 : 2000; // Wait longer if weight modal is also showing
      setTimeout(() => setShouldShowFeedbackModal(true), delay);
    }
  }, [isAuthenticated, user, shouldShowFeedbackModal, shouldShowWeightModal]);

  // COD System - Auto-show wellness check-in modal if not completed today
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Only show modal if COD System tables exist
    if (!codTablesExist) return;

    // Show wellness check-in modal if user hasn't done it today
    if (needsCheckin) {
      // Wait a bit for the app to load
      const timer = setTimeout(() => {
        setShowWellnessModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, needsCheckin, codTablesExist]);

  const handleSaveWeight = async (weight: number) => {
    // Use the weight progress system which now includes validation and gamification
    const success = await addWeightEntry(weight);

    if (success) {
      setShowWeightModal(false);
    }

    return success;
  };

  if (!isAuthenticated) {
    return null; // Enquanto redireciona
  }

  // Fetch current workout session
  const { currentSession, loading: workoutSessionLoading, hasWorkoutPlan } = useCurrentWorkoutSession();
  // const { progress, loading: progressLoading } = useProgress(user?.id || '');
  const progress: any[] = [];
  const progressLoading = false;
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-4">
      {/* Header with Date and Profile */}
      <div className="flex items-start justify-between mb-4 animate-fade-up">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={16} className="text-warning" />
          {currentDate}
        </div>

        {/* Notification system removed - deprecated */}
      </div>

      {/* Profile Section with safe area */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 animate-slide-in">
        <Avatar className="w-14 h-14 sm:w-16 sm:h-16 ring-2 ring-primary/20">
          <AvatarImage src={avatarUrl ?? undefined} alt={firstName} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary-variant text-white font-bold text-lg">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-tight">
            Olá, <span className="text-gradient-primary">{firstName}!</span>
          </h1>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="mb-6 text-center">
        <p className="text-foreground">
          Estou aqui para te guiar, vamos começar?
        </p>
      </div>

      {/* COD System - Readiness Dashboard */}
      <div className="mb-4">
        <ReadinessDashboard
          compact={false}
          onCheckIn={() => setShowWellnessModal(true)}
        />
      </div>

      {/* COD System Phase 2 - Evolution Charts (compact) */}
      {codTablesExist && (
        <div className="mb-4">
          <EvolutionCharts data={evolutionChartData} compact />
        </div>
      )}


      {/* Weight Progress Chart */}
      <WeightChart
        onWeightNeeded={() => setShowWeightModal(true)}
        aria-label="Gráfico de evolução de peso"
      />

      {/* Cards Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6"
        role="list"
        aria-label="Ações rápidas"
      >


      </div>

      {/* Quick Actions */}
      <QuickActions />



      {/* Stats Overview */}
      <DashboardStats
        workouts={currentSession ? [{ name: currentSession.sessionName }] : []}
        progress={progress}
        loading={workoutSessionLoading || progressLoading}
      />


      {hasWorkoutPlan && currentSession && (
        <div className="card-gradient p-6 mb-8 sm:mb-10 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Treino de Hoje</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              {currentSession.sessionLabel}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sessão</span>
              <span className="text-sm font-medium text-foreground">
                {currentSession.sessionName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duração estimada</span>
              <span className="text-sm font-medium text-foreground">
                {currentSession.estimatedDuration > 0 ? `${Math.round(currentSession.estimatedDuration)} min` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Exercícios</span>
              <span className="text-sm font-medium text-foreground">
                {currentSession.totalExercises} exercícios
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dificuldade</span>
              <span className="text-sm font-medium text-muted-foreground">
                {currentSession.difficulty}
              </span>
            </div>
          </div>

          <button
            onClick={onWorkoutClick}
            className="btn-primary w-full mt-4 py-3 sm:py-4 touch-feedback"
            aria-label={`Iniciar treino ${currentSession.sessionLabel}`}
          >
            Iniciar {currentSession.sessionLabel}
          </button>
        </div>
      )}

      {/* Weight Input Modal */}
      <WeightInputModal
        isOpen={showWeightModal}
        onClose={() => {
          clearError();
          setShowWeightModal(false);
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem(`weight_modal_dismissed_${today}`, 'true');
        }}
        onSave={handleSaveWeight}
        error={weightError}
      />

      {/* Weekly Feedback Modal */}
      <WeeklyFeedbackModal
        isOpen={shouldShowFeedbackModal}
        onClose={() => setShouldShowFeedbackModal(false)}
        onSubmit={submitWeeklyFeedback}
        loading={feedbackLoading}
        customQuestions={feedbackSettings?.custom_questions || []}
        feedbackFrequency={
          feedbackSettings?.feedback_frequency === 'daily' ? 'diário' :
            feedbackSettings?.feedback_frequency === 'weekly' ? 'semanal' :
              feedbackSettings?.feedback_frequency === 'biweekly' ? 'quinzenal' :
                feedbackSettings?.feedback_frequency === 'monthly' ? 'mensal' :
                  'periódico'
        }
      />

      {/* COD System - Wellness Check-in Modal */}
      <WellnessCheckinModal
        isOpen={showWellnessModal}
        onComplete={() => setShowWellnessModal(false)}
      />
    </div>
  );
};