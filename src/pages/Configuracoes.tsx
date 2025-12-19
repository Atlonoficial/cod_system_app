import { useEffect } from "react";
import { ArrowLeft, ChevronRight, User, Shield, LogOut, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { signOutUser } from "@/lib/supabase";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const DeleteAccountButton = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Call Edge Function to delete user
      const { error } = await supabase.functions.invoke('delete-account');

      if (error) throw error;

      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída permanentemente.",
      });

      // Force logout and redirect
      await signOutUser();
      window.location.href = '/';

    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir sua conta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-transparent p-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-destructive" />
              ) : (
                <Trash2 className="w-5 h-5 text-destructive" />
              )}
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Excluir Minha Conta</h3>
              <p className="text-sm text-destructive/70">Ação irreversível</p>
            </div>
          </div>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[90%] rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente sua conta, seus treinos, histórico e dados pessoais de nossos servidores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Excluindo..." : "Sim, excluir minha conta"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const Configuracoes = () => {
  const navigate = useNavigate();
  /* Notifications removed */
  // const { user } = useAuthContext(); -> Keeping user if needed for other things, but hook below used it.
  // Actually user is used in DeleteAccountButton so I should check if it is used in Configuracoes main component.
  // user is used for useNotificationPreferences(user?.id). If I remove that, I might not need user in the component if it's not used elsewhere.
  // Checking usage... user is used in line 107.


  const handleSair = async () => {
    try {
      await signOutUser();
      toast({
        title: "Desconectado",
        description: "Você foi desconectado com sucesso.",
      });
      // A navegação será automática pela AuthProvider
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro",
        description: "Erro ao desconectar. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handlePlanosClick = () => {
    navigate("/assinaturas-planos");
  };

  const configItems = [

    {
      icon: Crown,
      title: "Meu Acesso",
      description: "Detalhes do seu acesso",
      action: <ChevronRight className="w-4 h-4 text-muted-foreground" />,
      onClick: handlePlanosClick
    },
    {
      icon: Lock,
      title: "Conta e Segurança",
      description: "Email, senha e configurações de segurança",
      action: <ChevronRight className="w-4 h-4 text-muted-foreground" />,
      onClick: () => navigate("/conta-seguranca")
    },
    {
      icon: Shield,
      title: "Política de Privacidade",
      description: "Termos e condições de uso",
      action: <ChevronRight className="w-4 h-4 text-muted-foreground" />,
      onClick: () => navigate("/politica-privacidade")
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-safe-3xl">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/?tab=profile")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Configuration Items */}
        <div className="space-y-2">
          {configItems.map((item, index) => (
            <Card
              key={index}
              className="p-4 bg-card/50 border-border/50 hover:bg-card/70 transition-colors cursor-pointer"
              onClick={item.onClick}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>

                </div>
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                  {item.action}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Logout Button */}
        <Card className="p-4 bg-muted/30 border-border/30 hover:bg-muted/50 transition-colors cursor-pointer">
          <Button
            variant="ghost"
            onClick={handleSair}
            className="w-full justify-start text-foreground hover:text-foreground hover:bg-transparent p-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <LogOut className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Sair</h3>
                <p className="text-sm text-muted-foreground">Desconectar da conta</p>
              </div>
            </div>
          </Button>
        </Card>

        {/* Danger Zone - Delete Account */}
        <div className="pt-6">
          <h3 className="text-sm font-bold text-destructive mb-3 uppercase tracking-wider px-1">Zona de Perigo</h3>
          <Card className="p-4 bg-destructive/5 border-destructive/20 hover:bg-destructive/10 transition-colors cursor-pointer">
            <DeleteAccountButton />
          </Card>
        </div>

        {/* Footer Note */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
          <p className="text-primary text-sm font-medium">
            Alterações serão aplicadas ao seu app e notificadas ao seu professor, quando relevante.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;