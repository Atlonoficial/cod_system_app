import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentAnamnesisRequests, AnamnesisRequest } from '@/hooks/useStudentAnamnesisRequests';
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, CheckCircle2, ListTodo, FileText, Loader2 } from 'lucide-react';


const Anamnese = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pendingRequests, loading, submitAnamnesis, refetch } = useStudentAnamnesisRequests();
  const [selectedRequest, setSelectedRequest] = useState<AnamnesisRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (answers: any) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await submitAnamnesis(selectedRequest.id, answers);
      toast({
        title: "Anamnese enviada!",
        description: "Suas respostas foram salvas com sucesso.",
        duration: 3000,
      });
      setSelectedRequest(null);
      refetch();
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao salvar suas respostas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // View: Fill out specific form
  if (selectedRequest) {
    return (
      <div className="page-scroll-container flex flex-col fade-in">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 pt-safe flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedRequest(null)}
            className="-ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg line-clamp-1">{selectedRequest?.template?.title || 'Anamnese'}</h1>
          </div>
        </div>

        <div className="p-4 max-w-lg mx-auto">
          {selectedRequest?.template?.description && (
            <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {selectedRequest.template.description}
              </p>
            </div>
          )}

          <DynamicFormRenderer
            questions={selectedRequest?.template?.questions || []}
            onSubmit={handleSubmit}
            loading={submitting}
          />
        </div>
      </div>
    );
  }

  // View: List of pending requests
  return (
    <div className="page-scroll-container flex flex-col fade-in">
      {/* Header with back button */}
      <div className="p-4 pt-safe border-b border-border/30">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/?tab=profile")}
            className="text-foreground -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Anamneses</h1>
        </div>
        <p className="text-muted-foreground text-sm pl-10">Responda aos questionários solicitados pelo seu treinador.</p>
      </div>

      <div className="px-4 space-y-4 max-w-lg mx-auto">
        {pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold">Tudo em dia!</h3>
            <p className="text-muted-foreground max-w-xs">
              Você não tem nenhuma anamnese pendente para responder no momento.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-2">
              <ListTodo className="w-4 h-4" />
              <span>Pendentes ({pendingRequests.length})</span>
            </div>

            {pendingRequests.map((req) => (
              <Card
                key={req.id}
                className="active-card border-none bg-card/50 hover:bg-card transition-all cursor-pointer shadow-sm relative overflow-hidden group"
                onClick={() => setSelectedRequest(req)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-1.5 transition-all" />
                <CardHeader className="pb-2 pl-5">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      {req.template?.title || 'Anamnese'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pl-5">
                  {req.template?.description && (
                    <CardDescription className="line-clamp-2 mb-3">
                      {req.template.description}
                    </CardDescription>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Solicitado em {new Date(req.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export { Anamnese };
