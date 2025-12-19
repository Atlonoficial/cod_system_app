import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Phone, Youtube, Users } from "lucide-react";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useEffect, useRef } from "react";
import { openExternalLink } from "@/utils/openExternalLink";
import { Capacitor } from "@capacitor/core";

export const TeacherCard = () => {
  const { teacher, loading } = useTeacherProfile();

  const navigate = useNavigate();
  const { user } = useAuthContext();
  const viewTracked = useRef(false);

  // FASE 5: Rastrear visualização do perfil do professor
  useEffect(() => {
    if (teacher?.id && user?.id && !viewTracked.current) {
      viewTracked.current = true;
      supabase.from('profile_views').insert({
        viewer_id: user.id,
        profile_id: teacher.id
      }).then(({ error }) => {
        if (error) {
          console.warn('[TeacherCard] Failed to track profile view:', error);
        } else {
          console.log('[TeacherCard] ✅ Profile view tracked');
        }
      });
    }
  }, [teacher?.id, user?.id]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded mb-3 w-32"></div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // FASE 2: Fallback visual quando não há professor
  if (!teacher) {
    console.log('[TeacherCard] No teacher data available');
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-foreground">Meu Treinador</h3>
        <Card className="border-dashed">
          <CardContent className="p-6 text-center space-y-3">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum professor atribuído ainda
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Entre em contato com o suporte para vincular um professor
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }



  const handleInstagramClick = () => {
    if (teacher.instagram_url) {
      openExternalLink(teacher.instagram_url);
    }
  };

  const handleFacebookClick = () => {
    if (teacher.facebook_url) {
      openExternalLink(teacher.facebook_url);
    }
  };

  const handleYouTubeClick = () => {
    if (teacher.youtube_url) {
      openExternalLink(teacher.youtube_url);
    }
  };

  const handleWhatsAppClick = () => {
    // Prioriza whatsapp_url sobre whatsapp_number
    if (teacher.whatsapp_url) {
      openExternalLink(teacher.whatsapp_url);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-foreground">Meu Treinador</h3>
      <Card className="bg-gradient-to-br from-background to-muted/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarImage src={teacher.avatar_url} alt={teacher.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {teacher.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{teacher.name}</h4>
              {teacher.bio ? (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{teacher.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1 italic">
                  Entre em contato para mais informações
                </p>
              )}

              {teacher.specialties && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(Array.isArray(teacher.specialties) ? teacher.specialties : [teacher.specialties]).slice(0, 3).map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                  {(Array.isArray(teacher.specialties) ? teacher.specialties.length : 1) > 3 && (
                    <span className="text-xs text-muted-foreground">+{(Array.isArray(teacher.specialties) ? teacher.specialties.length : 1) - 3} mais</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <div className="flex gap-2">
              {teacher.instagram_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleInstagramClick}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                >
                  <Instagram className="h-4 w-4" />
                </Button>
              )}

              {teacher.facebook_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFacebookClick}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
              )}



              {teacher.whatsapp_url && Capacitor.getPlatform() !== 'ios' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWhatsAppClick}
                  className="h-8 w-8 p-0 hover:bg-green-600/10 hover:text-green-600"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};