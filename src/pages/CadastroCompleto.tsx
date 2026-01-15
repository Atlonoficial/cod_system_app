import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { supabase } from "@/integrations/supabase/client";
import { updateUserProfile } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Camera, Save, User, Edit2, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string()
    .min(1, "WhatsApp é obrigatório")
    .regex(/^(\(?\d{2}\)?[\s\-]?)?(\d{4,5}[\s\-]?\d{4})$/, "Formato de telefone inválido. Use (11) 99999-9999"),
  weight: z.number().optional(),
  height: z.number().optional(),
  body_fat: z.number().optional(),
  muscle_mass: z.number().optional(),
  goals: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CadastroCompleto() {
  const { user, userProfile } = useAuthContext();
  const { student, updateProfile } = useStudentProfile();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userProfile?.avatar_url || null);
  const [editingMeasurements, setEditingMeasurements] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userProfile?.name || "",
      email: userProfile?.email || "",
      phone: userProfile?.phone || "",
      weight: student?.weight || undefined,
      height: student?.height || undefined,
      body_fat: student?.body_fat || undefined,
      muscle_mass: student?.muscle_mass || undefined,
      goals: student?.goals || [],
    },
  });

  // Calcula % de completude do perfil
  const calculateCompleteness = () => {
    const fields = [
      userProfile?.name,
      userProfile?.email,
      userProfile?.phone,
      userProfile?.avatar_url,
      student?.weight,
      student?.height,
      student?.goals?.length,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file || !user?.id) return;

    // Validação de tamanho (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    // Validação de tipo
    if (!file.type.startsWith('image/')) {
      toast.error("Arquivo deve ser uma imagem.");
      return;
    }

    setUploading(true);
    try {
      // Use unique filename with timestamp for cache busting
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const path = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      await updateUserProfile(user.id, { avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
      toast.success("Foto de perfil atualizada!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);

      // Diagnóstico detalhado
      const errorMsg = error?.message || '';
      const errorCode = error?.statusCode || error?.status || '';

      console.error('[Avatar Upload] Details:', {
        message: errorMsg,
        code: errorCode,
        fullError: error
      });

      // Mensagens de erro específicas
      if (errorMsg.includes('Bucket not found') || errorCode === 404 || errorCode === '404') {
        toast.error("Configuração de storage pendente. Contate o suporte.");
      } else if (errorMsg.includes('policy') || errorCode === 403 || errorCode === '403') {
        toast.error("Sem permissão para upload. Verifique com o suporte.");
      } else if (errorMsg.includes('row-level security') || errorMsg.includes('RLS')) {
        toast.error("Erro de permissão. Tente fazer login novamente.");
      } else if (errorMsg.includes('network') || errorMsg.includes('Network')) {
        toast.error("Erro de conexão. Verifique sua internet.");
      } else {
        toast.error("Erro ao atualizar foto de perfil. Tente novamente.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleAvatarUpload(file);
  };

  const onSubmit = async (data: FormData) => {
    if (!user?.id) return;
    setSaving(true);

    try {
      // Atualizar perfil geral
      await updateUserProfile(user.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
      });

      toast.success("Perfil atualizado com sucesso!");
      navigate("/?tab=profile");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMeasurements = async () => {
    if (!user?.id || !student) return;
    setSavingMeasurements(true);

    try {
      const data = form.getValues();
      await updateProfile({
        weight: data.weight,
        height: data.height,
        body_fat: data.body_fat,
        muscle_mass: data.muscle_mass,
        measurements_updated_at: new Date().toISOString(),
      });

      toast.success("Medidas corporais atualizadas!");
      setEditingMeasurements(false);
    } catch (error) {
      console.error("Erro ao salvar medidas:", error);
      toast.error("Erro ao salvar medidas corporais");
    } finally {
      setSavingMeasurements(false);
    }
  };

  const handleSaveGoals = async () => {
    if (!user?.id || !student) return;
    setSavingGoals(true);

    try {
      const data = form.getValues();
      await updateProfile({
        goals: data.goals || [],
      });

      toast.success("Objetivos atualizados!");
      setEditingGoals(false);
    } catch (error) {
      console.error("Erro ao salvar objetivos:", error);
      toast.error("Erro ao salvar objetivos");
    } finally {
      setSavingGoals(false);
    }
  };

  return (
    <div className="page-scroll-container flex flex-col">
      {/* Fixed Header with Safe Area and Background to prevent overlap */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-safe bg-background">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/?tab=profile")}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Cadastro Completo</h1>
            <p className="text-xs text-muted-foreground">
              Complete suas informações pessoais
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pt-20 pb-safe-4xl">
        <div className="max-w-2xl mx-auto px-4">

          {/* Progress Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Perfil Completo</span>
                <span className="text-sm font-semibold text-primary">{calculateCompleteness()}%</span>
              </div>
              <Progress value={calculateCompleteness()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Preencha todas as informações para uma experiência personalizada
              </p>
            </CardContent>
          </Card>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Foto de Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Foto de Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-28 h-28 ring-2 ring-primary/20">
                      <AvatarImage src={avatarUrl ?? undefined} alt="Avatar" />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-primary-variant text-white">
                        {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 bg-primary hover:bg-primary/90 text-white shadow-lg"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="w-5 h-5" />
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Clique no ícone da câmera para alterar sua foto
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Seu nome completo"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="seu@email.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                      WhatsApp *
                    </Label>
                    <Input
                      id="phone"
                      {...form.register("phone")}
                      placeholder="(11) 99999-9999"
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          if (value.length >= 11) {
                            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                          } else if (value.length >= 6) {
                            value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                          } else if (value.length >= 2) {
                            value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
                          }
                        }
                        form.setValue("phone", value);
                      }}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medidas Corporais */}
            <Card className="mt-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Medidas Corporais</CardTitle>
                  {!editingMeasurements && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMeasurements(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!editingMeasurements ? (
                  // View Mode
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <Label className="text-sm font-medium text-muted-foreground">Peso</Label>
                      <p className="text-lg font-semibold mt-1">
                        {student?.weight ? `${student.weight} kg` : "Não informado"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <Label className="text-sm font-medium text-muted-foreground">Altura</Label>
                      <p className="text-lg font-semibold mt-1">
                        {student?.height ? `${student.height} cm` : "Não informado"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <Label className="text-sm font-medium text-muted-foreground">% Gordura</Label>
                      <p className="text-lg font-semibold mt-1">
                        {student?.body_fat ? `${student.body_fat}%` : "Não informado"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <Label className="text-sm font-medium text-muted-foreground">Massa Muscular</Label>
                      <p className="text-lg font-semibold mt-1">
                        {student?.muscle_mass ? `${student.muscle_mass} kg` : "Não informado"}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="weight">Peso (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          {...form.register("weight", { valueAsNumber: true })}
                          placeholder="70.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="height">Altura (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          step="0.1"
                          {...form.register("height", { valueAsNumber: true })}
                          placeholder="175"
                        />
                      </div>

                      <div>
                        <Label htmlFor="body_fat">% Gordura</Label>
                        <Input
                          id="body_fat"
                          type="number"
                          step="0.1"
                          {...form.register("body_fat", { valueAsNumber: true })}
                          placeholder="15.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="muscle_mass">Massa Muscular (kg)</Label>
                        <Input
                          id="muscle_mass"
                          type="number"
                          step="0.1"
                          {...form.register("muscle_mass", { valueAsNumber: true })}
                          placeholder="45.2"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingMeasurements(false);
                          // Reset form values to current data
                          form.setValue("weight", student?.weight);
                          form.setValue("height", student?.height);
                          form.setValue("body_fat", student?.body_fat);
                          form.setValue("muscle_mass", student?.muscle_mass);
                        }}
                        disabled={savingMeasurements}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveMeasurements}
                        disabled={savingMeasurements}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {savingMeasurements ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Objetivos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Objetivos</CardTitle>
                  {!editingGoals && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGoals(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!editingGoals ? (
                  // View Mode
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Label className="text-sm font-medium text-muted-foreground">Seus Objetivos</Label>
                    <p className="text-base mt-2 leading-relaxed">
                      {student?.goals?.length ? student.goals.join(", ") : "Nenhum objetivo definido ainda"}
                    </p>
                  </div>
                ) : (
                  // Edit Mode
                  <>
                    <div>
                      <Label htmlFor="goals">Seus Objetivos</Label>
                      <Textarea
                        id="goals"
                        placeholder="Descreva seus objetivos fitness (ex: perder peso, ganhar massa muscular, melhorar condicionamento...)"
                        className="mt-1"
                        value={student?.goals?.join(", ") || ""}
                        onChange={(e) => {
                          const goals = e.target.value.split(",").map(g => g.trim()).filter(Boolean);
                          form.setValue("goals", goals);
                        }}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingGoals(false);
                          // Reset form values to current data
                          form.setValue("goals", student?.goals || []);
                        }}
                        disabled={savingGoals}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveGoals}
                        disabled={savingGoals}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {savingGoals ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Botões para Dados Pessoais */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/?tab=profile")}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Dados Pessoais"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}