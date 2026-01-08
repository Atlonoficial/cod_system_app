import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Calendar, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddProgressPhotoDialog } from "@/components/progress/AddProgressPhotoDialog";
import { RequestNotificationBanner } from "@/components/notifications/RequestNotificationBanner";
import { useStudentRequests } from "@/hooks/useStudentRequests";

interface ProgressPhoto {
  id: string;
  title: string;
  image_url: string;
  date: string;
  notes?: string;
  created_at: string;
}

export const FotosProgresso = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { photoRequests, markAsCompleted } = useStudentRequests();

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await (supabase as any)
          .from("progress_photos")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (error) throw error;
        setPhotos((data || []) as ProgressPhoto[]);
      } catch (error) {
        console.error("Erro ao buscar fotos:", error);
        toast.error("Erro ao carregar fotos de progresso");
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [user?.id]);

  const handleAddSuccess = () => {
    const fetchPhotos = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await (supabase as any)
          .from("progress_photos")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (error) throw error;
        setPhotos((data || []) as ProgressPhoto[]);
      } catch (error) {
        console.error("Erro ao buscar fotos:", error);
        toast.error("Erro ao carregar fotos de progresso");
      }
    };
    fetchPhotos();

    // Mark any pending photo requests as completed
    if (photoRequests.length > 0) {
      markAsCompleted(photoRequests[0].id);
      toast.success("Solicitação atendida! ✅ Seu treinador foi notificado.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-safe-4xl">
      {/* Header */}
      <div className="p-4 pt-safe border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/?tab=profile")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Fotos de Progresso</h1>
          <span className="ml-auto text-xs bg-warning/20 text-warning px-2 py-1 rounded-full font-medium">
            {photos.length}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <select className="text-sm border border-border rounded px-2 py-1 bg-background">
            <option>Todos</option>
            <option>Frente</option>
            <option>Costas</option>
            <option>Lateral</option>
          </select>
        </div>
      </div>

      <div className="p-4">
        {/* Info Banner */}
        <Card className="mb-4 bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <p className="text-primary text-sm">
              Todas as fotos serão compartilhadas com seu professor.
            </p>
          </CardContent>
        </Card>

        {/* Request Banner */}
        <RequestNotificationBanner
          requests={photoRequests}
          type="photo"
          onActionClick={() => setShowAddDialog(true)}
        />

        {/* Add Photo Button */}
        <Button
          className="w-full mb-4"
          variant="outline"
          onClick={() => setShowAddDialog(true)}
        >
          <Camera className="w-4 h-4 mr-2" />
          Adicionar Nova Foto
        </Button>

        {/* Photos */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Carregando fotos...
            </CardContent>
          </Card>
        ) : photos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma foto de progresso cadastrada.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Adicione fotos para acompanhar sua evolução visual.
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm font-medium">{photo.title}</p>
                    <p className="text-white/80 text-xs">
                      {new Date(photo.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {photos.map((photo) => (
              <Card key={photo.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{photo.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(photo.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {photo.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{photo.notes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddProgressPhotoDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};