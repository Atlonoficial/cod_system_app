import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, TrendingUp, Scale, Ruler, Activity, FileText, ChevronDown, ChevronRight, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { NewAssessmentDialog } from "@/components/physical-assessment/NewAssessmentDialog";
import { Badge } from "@/components/ui/badge";

interface PhysicalAssessmentData {
  type: string;
  value: number;
  unit: string;
  notes: string;
}

interface PhysicalAssessment {
  id: string;
  date: string;
  created_at: string;
  basicMeasures: PhysicalAssessmentData[];
  upperLimbs: PhysicalAssessmentData[];
  torso: PhysicalAssessmentData[];
  lowerLimbs: PhysicalAssessmentData[];
  skinfolds: PhysicalAssessmentData[];
  protocol?: PhysicalAssessmentData;
  // New fields for comprehensive evaluations
  isComprehensive?: boolean;
  templateName?: string;
  overallScore?: number;
  teacherNotes?: string;
}

export const AvaliacoesFisicas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAssessments, setExpandedAssessments] = useState<Set<string>>(new Set());

  const fetchAssessments = useCallback(async () => {
    if (!user?.id) return;

    try {
      // 1. Buscar dados LEGADOS da tabela 'progress'
      const { data: progressData, error: progressError } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "physical_assessment")
        .order("date", { ascending: false });

      if (progressError) throw progressError;

      // 2. Buscar NOVAS avaliações da tabela 'evaluations'
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from("evaluations")
        .select(`
          *,
          template:evaluation_templates(name)
        `)
        .eq("student_id", user.id)
        .order("evaluation_date", { ascending: false });

      if (evaluationsError) {
        console.error("Erro ao buscar novas avaliações:", evaluationsError);
        // Não trava o app, apenas loga o erro
      }

      // Processar dados legados (agrupamento por data)
      const legacyAssessments: Record<string, PhysicalAssessment> = (progressData || []).reduce((acc: any, item: any) => {
        const dateKey = item.date.split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {
            id: `legacy-${dateKey}`,
            date: dateKey,
            created_at: item.created_at,
            basicMeasures: [],
            upperLimbs: [],
            torso: [],
            lowerLimbs: [],
            skinfolds: [],
            protocol: null,
            isComprehensive: false
          };
        }

        const assessmentData = {
          type: item.type,
          value: item.value,
          unit: item.unit,
          notes: item.notes
        };

        // Categorizar dados por tipo
        if (['weight', 'height', 'body_fat', 'muscle_mass'].includes(item.notes)) {
          acc[dateKey].basicMeasures.push(assessmentData);
        } else if (item.notes.includes('Braço') || item.notes.includes('Antebraço')) {
          acc[dateKey].upperLimbs.push(assessmentData);
        } else if (['Pescoço', 'Ombro', 'Peitoral', 'Cintura', 'Abdômen', 'Quadril'].includes(item.notes)) {
          acc[dateKey].torso.push(assessmentData);
        } else if (item.notes.includes('Panturrilha') || item.notes.includes('Coxa')) {
          acc[dateKey].lowerLimbs.push(assessmentData);
        } else if (item.notes.includes('Dobra')) {
          acc[dateKey].skinfolds.push(assessmentData);
        } else if (item.notes.includes('Protocolo')) {
          acc[dateKey].protocol = assessmentData;
        }

        return acc;
      }, {});

      // Processar novas avaliações
      const comprehensiveAssessments: PhysicalAssessment[] = (evaluationsData || []).map((evaluation: any) => {
        const measures = evaluation.physical_measurements || {};

        // Converter o formato JSON de medidas para o formato de array categorizado
        const basicMeasures: PhysicalAssessmentData[] = [];
        const upperLimbs: PhysicalAssessmentData[] = [];
        const torso: PhysicalAssessmentData[] = [];
        const lowerLimbs: PhysicalAssessmentData[] = [];
        const skinfolds: PhysicalAssessmentData[] = [];

        Object.entries(measures).forEach(([key, value]: [string, any]) => {
          // Lógica simplificada de categorização baseada na chave ou metadados conhecidos
          // Como o JSON não tem 'notes' categorizadas, vamos tentar inferir ou colocar em 'Outros' se necessário
          // Para simplificar, vamos mapear alguns conhecidos

          const data = {
            type: 'physical_assessment',
            value: Number(value),
            unit: 'cm', // Default, ajustado abaixo
            notes: key
          };

          if (['weight', 'peso'].includes(key)) { data.unit = 'kg'; data.notes = 'weight'; basicMeasures.push(data); }
          else if (['height', 'altura'].includes(key)) { data.unit = 'cm'; data.notes = 'height'; basicMeasures.push(data); }
          else if (['body_fat', 'gordura'].includes(key)) { data.unit = '%'; data.notes = 'body_fat'; basicMeasures.push(data); }
          else if (['muscle_mass', 'massa_magra'].includes(key)) { data.unit = 'kg'; data.notes = 'muscle_mass'; basicMeasures.push(data); }
          else if (key.includes('braco') || key.includes('antebraço')) upperLimbs.push(data);
          else if (key.includes('peitoral') || key.includes('cintura') || key.includes('abdomen') || key.includes('quadril')) torso.push(data);
          else if (key.includes('coxa') || key.includes('panturrilha')) lowerLimbs.push(data);
          else if (key.includes('dobra')) skinfolds.push(data);
          else basicMeasures.push(data); // Fallback
        });

        return {
          id: evaluation.id,
          date: evaluation.evaluation_date,
          created_at: evaluation.created_at,
          basicMeasures,
          upperLimbs,
          torso,
          lowerLimbs,
          skinfolds,
          protocol: undefined,
          isComprehensive: true,
          templateName: evaluation.template?.name || 'Avaliação Completa',
          overallScore: evaluation.overall_score,
          teacherNotes: evaluation.teacher_notes
        };
      });

      // Combinar e ordenar
      const allAssessments = [
        ...Object.values(legacyAssessments),
        ...comprehensiveAssessments
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setAssessments(allAssessments);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      toast.error("Erro ao carregar avaliações físicas");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Preparar dados para o gráfico de peso
  const weightData = assessments
    .filter(a => a.basicMeasures.find(m => m.notes === 'weight'))
    .map(a => {
      const weightMeasure = a.basicMeasures.find(m => m.notes === 'weight');
      return {
        date: new Date(a.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        weight: weightMeasure?.value || 0
      };
    })
    .reverse();

  const toggleAssessmentExpansion = (assessmentId: string) => {
    setExpandedAssessments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assessmentId)) {
        newSet.delete(assessmentId);
      } else {
        newSet.add(assessmentId);
      }
      return newSet;
    });
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
          <h1 className="text-xl font-bold text-foreground">Avaliações Físicas</h1>
          <span className="ml-auto text-xs bg-warning/20 text-warning px-2 py-1 rounded-full font-medium">
            {assessments.length}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Weight Chart */}
        {weightData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução do Peso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Banner */}
        <Card className="mb-4 bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <p className="text-primary text-sm">
              Suas métricas estão sendo enviadas em tempo real ao seu professor.
            </p>
          </CardContent>
        </Card>

        {/* Add Assessment Button */}
        <div className="mb-6">
          <NewAssessmentDialog onAssessmentCreated={fetchAssessments} />
        </div>

        {/* Historical Assessments */}
        <h2 className="text-lg font-semibold mb-3">Histórico de Avaliações</h2>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Carregando avaliações...
            </CardContent>
          </Card>
        ) : assessments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma avaliação física registrada.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Aguarde seu professor adicionar suas avaliações.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => {
              const isExpanded = expandedAssessments.has(assessment.id);
              const basicMeasuresMap = assessment.basicMeasures.reduce((acc, measure) => {
                acc[measure.notes] = measure;
                return acc;
              }, {} as Record<string, PhysicalAssessmentData>);

              return (
                <Card key={assessment.id} className={`overflow-hidden ${assessment.isComprehensive ? 'border-l-4 border-l-blue-500' : ''}`}>
                  <CardContent className="p-0">
                    {/* Cabeçalho clicável */}
                    <div
                      className="p-4 cursor-pointer hover:bg-accent/30 transition-colors border-b"
                      onClick={() => toggleAssessmentExpansion(assessment.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className={`w-5 h-5 ${assessment.isComprehensive ? 'text-blue-600' : 'text-primary'}`} />
                          <div>
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                              {assessment.templateName || 'Avaliação Física'}
                              {assessment.isComprehensive && <Badge variant="secondary" className="text-[10px] h-5">Nova</Badge>}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(assessment.date).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric"
                              })}
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* Resumo básico quando fechado */}
                      {!isExpanded && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {basicMeasuresMap.weight && (
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Scale className="w-4 h-4 text-primary" />
                                <span className="text-sm text-muted-foreground">Peso</span>
                              </div>
                              <p className="font-semibold text-foreground">{basicMeasuresMap.weight.value} {basicMeasuresMap.weight.unit}</p>
                            </div>
                          )}

                          {assessment.overallScore && (
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <BarChart3 className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-muted-foreground">Nota Geral</span>
                              </div>
                              <p className="font-semibold text-foreground">{assessment.overallScore.toFixed(1)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-accent/10">
                        {assessment.teacherNotes && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Observações do Professor</p>
                            <p className="text-sm text-foreground">{assessment.teacherNotes}</p>
                          </div>
                        )}

                        {/* Medidas Básicas */}
                        {assessment.basicMeasures.length > 0 && (
                          <Collapsible defaultOpen>
                            <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm text-primary hover:text-primary/80">
                              <Scale className="w-4 h-4" />
                              Medidas Básicas
                              <ChevronDown className="w-4 h-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <div className="grid grid-cols-2 gap-3">
                                {assessment.basicMeasures.map((measure, idx) => (
                                  <div key={idx} className="bg-background p-3 rounded-lg border">
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {measure.notes === 'weight' ? 'Peso' :
                                        measure.notes === 'height' ? 'Altura' :
                                          measure.notes === 'body_fat' ? '% Gordura' :
                                            measure.notes === 'muscle_mass' ? 'Massa Magra' : measure.notes}
                                    </p>
                                    <p className="font-semibold">{measure.value} {measure.unit}</p>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                        {/* Membros Superiores */}
                        {assessment.upperLimbs.length > 0 && (
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm text-primary hover:text-primary/80">
                              <Ruler className="w-4 h-4" />
                              Membros Superiores
                              <ChevronDown className="w-4 h-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <div className="grid grid-cols-2 gap-3">
                                {assessment.upperLimbs.map((measure, idx) => (
                                  <div key={idx} className="bg-background p-3 rounded-lg border">
                                    <p className="text-xs text-muted-foreground">{measure.notes}</p>
                                    <p className="font-semibold">{measure.value} {measure.unit}</p>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                        {/* Tronco */}
                        {assessment.torso.length > 0 && (
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm text-primary hover:text-primary/80">
                              <Activity className="w-4 h-4" />
                              Tronco
                              <ChevronDown className="w-4 h-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <div className="grid grid-cols-2 gap-3">
                                {assessment.torso.map((measure, idx) => (
                                  <div key={idx} className="bg-background p-3 rounded-lg border">
                                    <p className="text-xs text-muted-foreground">{measure.notes}</p>
                                    <p className="font-semibold">{measure.value} {measure.unit}</p>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                        {/* Membros Inferiores */}
                        {assessment.lowerLimbs.length > 0 && (
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm text-primary hover:text-primary/80">
                              <TrendingUp className="w-4 h-4" />
                              Membros Inferiores
                              <ChevronDown className="w-4 h-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <div className="grid grid-cols-2 gap-3">
                                {assessment.lowerLimbs.map((measure, idx) => (
                                  <div key={idx} className="bg-background p-3 rounded-lg border">
                                    <p className="text-xs text-muted-foreground">{measure.notes}</p>
                                    <p className="font-semibold">{measure.value} {measure.unit}</p>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                        {/* Dobras Cutâneas */}
                        {(assessment.skinfolds.length > 0 || assessment.protocol) && (
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm text-primary hover:text-primary/80">
                              <Ruler className="w-4 h-4" />
                              Dobras Cutâneas
                              <ChevronDown className="w-4 h-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 space-y-3">
                              {assessment.protocol && (
                                <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                                  <p className="text-xs text-primary font-medium">Protocolo Utilizado</p>
                                  <p className="font-semibold">{assessment.protocol.notes.replace('Protocolo: ', '')}</p>
                                </div>
                              )}
                              {assessment.skinfolds.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                  {assessment.skinfolds.map((measure, idx) => (
                                    <div key={idx} className="bg-background p-3 rounded-lg border">
                                      <p className="text-xs text-muted-foreground">{measure.notes}</p>
                                      <p className="font-semibold">{measure.value} {measure.unit}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};