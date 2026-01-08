import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FileText, Download, Calendar, Droplets, Heart, ScanLine, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AddMedicalExamDialog } from '@/components/medical/AddMedicalExamDialog';
import { RequestNotificationBanner } from '@/components/notifications/RequestNotificationBanner';
import { useStudentRequests } from '@/hooks/useStudentRequests';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/components/auth/AuthProvider';

interface MedicalExam {
  id: string;
  title: string;
  date: string;
  file_url?: string;
  notes?: string;
  created_at: string;
  category: 'blood' | 'cardiology' | 'imaging' | 'others';
}

export const ExamesMedicos = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'blood' | 'cardiology' | 'imaging' | 'others'>('all');
  const { toast } = useToast();
  const { examRequests, markAsCompleted } = useStudentRequests();

  const fetchExams = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('medical_exams')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setExams((data || []) as MedicalExam[]);
    } catch (error) {
      console.error('Erro ao buscar exames:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar exames médicos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [user?.id]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'blood': return <Droplets className="w-4 h-4 text-red-500" />;
      case 'cardiology': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'imaging': return <ScanLine className="w-4 h-4 text-blue-500" />;
      default: return <ClipboardList className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'blood': return 'Exames de Sangue';
      case 'cardiology': return 'Cardiológicos';
      case 'imaging': return 'Exames de Imagem';
      default: return 'Outros';
    }
  };

  const getCategoryCount = (category: 'blood' | 'cardiology' | 'imaging' | 'others') => {
    return exams.filter(exam => exam.category === category).length;
  };

  const handleAddSuccess = () => {
    fetchExams();
    // Mark any pending exam requests as completed
    if (examRequests.length > 0) {
      markAsCompleted(examRequests[0].id);
      toast({
        title: "Solicitação atendida! ✅",
        description: "Seu treinador foi notificado.",
      });
    }
  };

  // Calculate filtered exams based on selected category
  const filteredExams = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return exams;
    }
    return exams.filter(exam => exam.category === selectedCategory);
  }, [exams, selectedCategory]);

  return (
    <div className="min-h-screen bg-background pb-safe-3xl">
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
          <h1 className="text-xl font-bold text-foreground">Exames Médicos</h1>
        </div>
      </div>

      <div className="p-6">
        <Alert className="mb-4">
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Seus exames médicos são atualizados em tempo real e ficam disponíveis para seu professor acompanhar sua evolução.
          </AlertDescription>
        </Alert>

        {/* Request Banner */}
        <RequestNotificationBanner
          requests={examRequests}
          type="exam"
          onActionClick={() => setShowAddDialog(true)}
        />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Meus Exames Médicos</h2>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Exame
          </Button>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card
            className={`cursor-pointer transition-all ${selectedCategory === 'blood' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedCategory(selectedCategory === 'blood' ? 'all' : 'blood')}
          >
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <Droplets className="w-6 h-6 text-red-500" />
                <span className="text-sm font-medium">Sangue</span>
                <Badge variant="secondary">{getCategoryCount('blood')}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${selectedCategory === 'cardiology' ? 'ring-2 ring-pink-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedCategory(selectedCategory === 'cardiology' ? 'all' : 'cardiology')}
          >
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <Heart className="w-6 h-6 text-pink-500" />
                <span className="text-sm font-medium">Cardio</span>
                <Badge variant="secondary">{getCategoryCount('cardiology')}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${selectedCategory === 'imaging' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedCategory(selectedCategory === 'imaging' ? 'all' : 'imaging')}
          >
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <ScanLine className="w-6 h-6 text-blue-500" />
                <span className="text-sm font-medium">Imagem</span>
                <Badge variant="secondary">{getCategoryCount('imaging')}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${selectedCategory === 'others' ? 'ring-2 ring-gray-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedCategory(selectedCategory === 'others' ? 'all' : 'others')}
          >
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <ClipboardList className="w-6 h-6 text-gray-500" />
                <span className="text-sm font-medium">Outros</span>
                <Badge variant="secondary">{getCategoryCount('others')}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedCategory !== 'all' && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              ← Mostrar todos os exames
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando exames...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {selectedCategory === 'all'
                ? 'Nenhum exame médico encontrado.'
                : `Nenhum exame da categoria "${getCategoryName(selectedCategory)}" encontrado.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => (
              <Card key={exam.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(exam.category)}
                        <h3 className="font-medium">{exam.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(exam.category)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(exam.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {exam.notes && (
                        <p className="text-sm text-muted-foreground">{exam.notes}</p>
                      )}
                    </div>
                    {exam.file_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={exam.file_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddMedicalExamDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};