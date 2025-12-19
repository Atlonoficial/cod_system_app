import { useState, useRef } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { getUserProfile } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Camera, Calendar, CreditCard, ClipboardList, Stethoscope, Images, Ruler, Shield, Cog, Target, Heart, Activity } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { TeacherCard } from "./TeacherCard";
import { DynamicBadge } from "@/components/ui/DynamicBadge";
import { useViewedItems } from "@/hooks/useViewedItems";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useAnamneseCompletion } from "@/hooks/useAnamneseCompletion";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useOptimizedAvatar } from "@/hooks/useOptimizedAvatar";
import { ProfileStats } from "./ProfileStats";

export const Profile = () => {
  const { user, userProfile } = useAuthContext();
  const [uploading, setUploading] = useState(false);
  const { light: hapticLight, success: hapticSuccess } = useHapticFeedback();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Optimized hooks
  const { markAsViewed } = useViewedItems(user?.id);
  const profileCompletion = useProfileCompletion();
  const anamneseCompletion = useAnamneseCompletion();
  const { sessionsCount, activeDays, examCount, photoCount, assessmentCount, loading: statsLoading } = useProfileStats();
  const { avatarUrl, memberSince, displayName, avatarFallback } = useOptimizedAvatar();

  // Points are no longer tracked since gamification was removed
  const points = sessionsCount * 10; // Simple calculation based on sessions

  // Statistics are now handled by useProfileStats hook

  const handleAvatarUpload = async (file: File) => {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      // Use unique filename with timestamp for cache busting
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const path = `${user.id}/${fileName}`;

      // Upload para bucket público "avatars"
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          contentType: file.type,
          upsert: true
        });
      if (uploadError) throw uploadError;

      // Public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      // Atualiza perfil na database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Force refresh user profile to trigger real-time sync
      try {
        const updatedProfile = await getUserProfile(user.id);
        if (updatedProfile) {
          console.log('Profile updated successfully, real-time will sync');
        }
      } catch (refreshError) {
        console.error('Error refreshing profile:', refreshError);
      }

      hapticSuccess();
      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao atualizar foto de perfil");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleAvatarUpload(file);
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleCardClick = (path: string, category?: 'profile' | 'anamnese' | 'exams' | 'photos' | 'assessments') => {
    hapticLight();
    if (category) {
      markAsViewed(path, category);
    }
    navigate(path);
  };

  return (
    <div className="p-4 sm:p-6 pt-6 sm:pt-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6 space-y-3">
        <div className="relative mb-3 animate-fade-up">
          <Avatar className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-primary/10">
            <AvatarImage src={avatarUrl ?? undefined} alt="Avatar do usuário" />
            <AvatarFallback className="text-xl">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <Button
            size="sm"
            variant="secondary"
            className={`absolute -bottom-2 -right-2 rounded-full w-9 h-9 p-0 ${uploading ? 'animate-pulse' : ''}`}
            onClick={triggerFileSelect}
            disabled={uploading}
            aria-label="Alterar foto de perfil"
          >
            {uploading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="animate-fade-up stagger-delay-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1 leading-tight">
            {displayName}
          </h1>
          {memberSince && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 leading-relaxed justify-center">
              <Calendar className="w-4 h-4" /> Membro desde {memberSince}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 animate-fade-up stagger-delay-2">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
          <span className="font-semibold text-base sm:text-lg text-foreground">{(points || 0).toLocaleString("pt-BR")} pontos</span>
        </div>
      </div>

      {/* Stats */}
      <ProfileStats
        points={points}
        sessionsCount={sessionsCount}
        activeDays={activeDays}
        loading={statsLoading}
      />

      {/* Teacher Profile */}
      <TeacherCard />

      {/* Meus Dados */}
      <h2 className="text-base sm:text-lg font-semibold mb-3 mt-6 text-foreground tracking-tight">Meus Dados</h2>
      <div className="space-y-3">
        <Card
          role="button"
          onClick={() => handleCardClick("/cadastro-completo", 'profile')}
          className="hover:bg-muted/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative touch-feedback-light animate-fade-up border border-border/50"
          tabIndex={0}
          aria-label={`Acessar cadastro completo. Progresso: ${profileCompletion.percentage}%`}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCardClick("/cadastro-completo", 'profile');
            }
          }}
        >
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base leading-tight text-foreground mb-1">Cadastro Completo</p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Complete suas informações pessoais</p>
            </div>
            <DynamicBadge
              percentage={profileCompletion.percentage}
              show={!profileCompletion.isComplete}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dados e Configurações */}
      <h2 className="text-base sm:text-lg font-semibold mb-3 mt-6 text-foreground tracking-tight">Dados e Configurações</h2>
      <div className="space-y-3 mb-16">
        <Card
          role="button"
          onClick={() => handleCardClick("/anamnese", 'anamnese')}
          className="hover:bg-muted/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative touch-feedback-light animate-fade-up border border-border/50 stagger-delay-1"
          tabIndex={0}
          aria-label="Acessar anamnese e questionário de saúde"
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCardClick("/anamnese", 'anamnese');
            }
          }}
        >
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base leading-tight text-foreground mb-1">Anamnese</p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Histórico médico e questionário de saúde</p>
            </div>
            <DynamicBadge
              percentage={anamneseCompletion.hasAnamnese ? anamneseCompletion.percentage : undefined}
              status={!anamneseCompletion.hasAnamnese ? 'new' : undefined}
              show={!anamneseCompletion.isComplete}
            />
          </CardContent>
        </Card>

        <Card role="button" onClick={() => navigate("/assinaturas-planos")} className="hover:bg-muted/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Meu Acesso</p>
              <p className="text-sm text-muted-foreground">Status da consultoria</p>
            </div>
          </CardContent>
        </Card>

        <Card role="button" onClick={() => navigate("/conexoes-saude")} className="hover:bg-muted/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Conexões de Saúde</p>
              <p className="text-sm text-muted-foreground">Apple Health, Google Fit</p>
            </div>
          </CardContent>
        </Card>

        <Card role="button" onClick={() => navigate("/wellness-history")} className="hover:bg-muted/40 transition-colors border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Histórico de Bem-Estar</p>
              <p className="text-sm text-muted-foreground">Seus check-ins dos últimos 7 dias</p>
            </div>
          </CardContent>
        </Card>

        <Card role="button" onClick={() => handleCardClick("/exames-medicos", 'exams')} className="hover:bg-muted/40 transition-colors relative">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Exames Médicos</p>
              <p className="text-sm text-muted-foreground">Últimos resultados</p>
            </div>
            <DynamicBadge
              count={examCount}
              show={examCount > 0}
            />
          </CardContent>
        </Card>

        <Card role="button" onClick={() => handleCardClick("/fotos-progresso", 'photos')} className="hover:bg-muted/40 transition-colors relative">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Images className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Fotos de Progresso</p>
              <p className="text-sm text-muted-foreground">Evolução visual</p>
            </div>
            <DynamicBadge
              count={photoCount}
              show={photoCount > 0}
            />
          </CardContent>
        </Card>

        <Card role="button" onClick={() => handleCardClick("/avaliacoes-fisicas", 'assessments')} className="hover:bg-muted/40 transition-colors relative">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Ruler className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Avaliações Físicas</p>
              <p className="text-sm text-muted-foreground">Medidas e composição</p>
            </div>
            <DynamicBadge
              count={assessmentCount}
              show={assessmentCount > 0}
            />
          </CardContent>
        </Card>

        <Card role="button" onClick={() => navigate("/configuracoes")} className="hover:bg-muted/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Cog className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Configurações</p>
              <p className="text-sm text-muted-foreground">Preferências do aplicativo</p>
            </div>
          </CardContent>
        </Card>

        <Card role="button" onClick={() => navigate("/conta-seguranca")} className="hover:bg-muted/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Conta & Segurança</p>
              <p className="text-sm text-muted-foreground">Alterar senha e sessão</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
