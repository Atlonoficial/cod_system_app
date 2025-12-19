import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Sparkles } from "lucide-react";

export const AuthVerified = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    document.title = "Email confirmado";

    // Countdown automático
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4 relative">
            <CheckCircle className="h-16 w-16 text-green-500 animate-in zoom-in-50" />
            <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <CardTitle className="text-2xl">✅ Email Confirmado!</CardTitle>
          <CardDescription className="text-base">
            Sua conta foi verificada com sucesso.<br />
            Bem-vindo! 🎉
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Redirecionando em <strong className="text-primary text-lg">{countdown}s</strong>
          </div>
          <Button
            className="w-full"
            onClick={() => navigate("/", { replace: true })}
          >
            Ir para o App agora
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AuthVerified;
