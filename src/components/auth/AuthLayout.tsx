import { AppLogo } from '@/components/ui/AppLogo';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export const AuthLayout = ({ children, title, description }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-6">
            <img
              src="/cod-logo.png"
              alt="COD System"
              className="h-16 w-auto mx-auto"
            />
          </div>
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
          {description && <p className="text-muted-foreground mt-2">{description}</p>}
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
        <div className="px-6 pb-6 text-center text-xs text-muted-foreground">
          <p>
            Ao continuar, você concorda com nossos{" "}
            <a href="/politica-privacidade" className="underline hover:text-primary">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a href="/politica-privacidade" className="underline hover:text-primary">
              Política de Privacidade
            </a>
            .
          </p>
        </div>
      </Card>
    </div>
  );
};