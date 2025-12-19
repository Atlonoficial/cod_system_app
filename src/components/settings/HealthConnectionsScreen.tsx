/**
 * COD System - Health Connections Screen
 * 
 * Allows users to connect to Apple Health (iOS) or Google Fit (Android)
 * to automatically sync biometric data like sleep and HRV.
 * 
 * Garmin and Strava sync through Apple Health/Google Fit natively,
 * so this is the only connection needed.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Heart,
    Moon,
    Activity,
    Smartphone,
    Check,
    X,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    Info
} from 'lucide-react';
import { useBiometricSync } from '@/hooks/useBiometricSync';
import { Capacitor } from '@capacitor/core';

interface HealthConnectionsScreenProps {
    onBack?: () => void;
}

export const HealthConnectionsScreen: React.FC<HealthConnectionsScreenProps> = ({ onBack }) => {
    const {
        biometricData,
        loading,
        error,
        requestPermissions,
        syncHealthData,
        hasHealthPermission,
        canAutoSync
    } = useBiometricSync();

    const [isConnecting, setIsConnecting] = useState(false);
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    const healthServiceName = platform === 'ios' ? 'Apple Health' : 'Google Fit';
    const healthServiceIcon = platform === 'ios' ? '🍎' : '💚';

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const granted = await requestPermissions();
            if (granted) {
                await syncHealthData();
            }
        } catch (err) {
            console.error('Error connecting:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSync = async () => {
        await syncHealthData();
    };

    // Format last sync time
    const formatLastSync = () => {
        if (!biometricData.lastSyncedAt) return 'Nunca sincronizado';
        const diff = Date.now() - biometricData.lastSyncedAt.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Agora mesmo';
        if (mins < 60) return `${mins} min atrás`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h atrás`;
        return `${Math.floor(hours / 24)} dias atrás`;
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                )}
                <div>
                    <h1 className="text-xl font-bold">Conexões de Saúde</h1>
                    <p className="text-sm text-muted-foreground">
                        Sincronize dados de sono e recuperação
                    </p>
                </div>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-auto pb-24">
                {/* Connection Status Card */}
                <Card className={hasHealthPermission ? 'border-green-500/30' : ''}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{healthServiceIcon}</span>
                                <span>{healthServiceName}</span>
                            </div>
                            <Badge variant={hasHealthPermission ? 'default' : 'secondary'}>
                                {hasHealthPermission ? (
                                    <><Check className="w-3 h-3 mr-1" /> Conectado</>
                                ) : (
                                    <><X className="w-3 h-3 mr-1" /> Desconectado</>
                                )}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!isNative ? (
                            // Web/Development message
                            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-yellow-500">Disponível apenas no app nativo</p>
                                    <p className="text-muted-foreground mt-1">
                                        A integração com {healthServiceName} só funciona quando o app está
                                        instalado no seu dispositivo iOS ou Android.
                                    </p>
                                </div>
                            </div>
                        ) : !hasHealthPermission ? (
                            // Not connected
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Conecte para sincronizar automaticamente seus dados de sono e
                                    variabilidade cardíaca (VFC) no check-in diário.
                                </p>
                                <Button
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isConnecting ? (
                                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Conectando...</>
                                    ) : (
                                        <><Smartphone className="w-4 h-4 mr-2" /> Conectar {healthServiceName}</>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            // Connected
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Última sincronização</span>
                                    <span className="text-sm font-medium">{formatLastSync()}</span>
                                </div>
                                <Button
                                    onClick={handleSync}
                                    disabled={loading}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {loading ? (
                                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sincronizando...</>
                                    ) : (
                                        <><RefreshCw className="w-4 h-4 mr-2" /> Sincronizar Agora</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Data Types Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Dados Sincronizados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                    <Moon className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="font-medium">Sono</p>
                                    <p className="text-xs text-muted-foreground">Duração e qualidade</p>
                                </div>
                            </div>
                            <Check className={`w-5 h-5 ${hasHealthPermission ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-medium">Variabilidade Cardíaca</p>
                                    <p className="text-xs text-muted-foreground">HRV para recuperação</p>
                                </div>
                            </div>
                            <Check className={`w-5 h-5 ${hasHealthPermission ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium">Frequência Cardíaca</p>
                                    <p className="text-xs text-muted-foreground">FC de repouso</p>
                                </div>
                            </div>
                            <Check className={`w-5 h-5 ${hasHealthPermission ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card - Garmin/Strava */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="font-medium text-sm">Usa Garmin ou Strava?</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Os dados do seu <strong>Garmin</strong> e <strong>Strava</strong> já são
                                    automaticamente sincronizados com {healthServiceName}. Basta ativar
                                    "Compartilhar com {healthServiceName}" nas configurações desses apps.
                                </p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">⌚ Garmin</Badge>
                                    <Badge variant="outline" className="text-xs">🏃 Strava</Badge>
                                    <span className="text-xs text-muted-foreground">→</span>
                                    <Badge variant="outline" className="text-xs">{healthServiceIcon} {healthServiceName}</Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* How it works */}
                <div className="p-4 text-center text-xs text-muted-foreground">
                    <p>Os dados sincronizados são usados para preencher</p>
                    <p>automaticamente seu check-in de prontidão diário.</p>
                </div>
            </div>
        </div>
    );
};

export default HealthConnectionsScreen;
