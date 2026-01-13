/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COD System - Health Connections Screen (Build 20 - WITH DEBUG)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * IMPORTANTE: Agora com LOGS VISÍVEIS na tela para debug sem Mac
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    Info,
    Bug,
    Copy
} from 'lucide-react';
import { useBiometricSync } from '@/hooks/useBiometricSync';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { debugLog, getDebugLogs, subscribeToLogs, clearDebugLogs } from '@/lib/debugLogger';

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
    const [connectionTimeout, setConnectionTimeout] = useState(false);
    const [showDebugLogs, setShowDebugLogs] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    const healthServiceName = platform === 'ios' ? 'Apple Health' : 'Google Fit';
    const healthServiceIcon = platform === 'ios' ? '🍎' : '💚';

    // Subscribe to debug logs
    useEffect(() => {
        setDebugLogs(getDebugLogs());
        const unsubscribe = subscribeToLogs((logs) => {
            setDebugLogs(logs);
        });
        return unsubscribe;
    }, []);

    const handleConnect = async () => {
        debugLog('UI', '========== BOTÃO CLICADO ==========');
        debugLog('UI', `Plataforma: ${platform}, Nativo: ${isNative}`);

        setIsConnecting(true);
        setConnectionTimeout(false);
        setShowDebugLogs(true); // Mostrar logs automaticamente

        const timeoutId = setTimeout(() => {
            debugLog('UI', '⏰ TIMEOUT! Conexão levou mais de 8 segundos');
            setConnectionTimeout(true);
            setIsConnecting(false);
        }, 8000);

        try {
            debugLog('UI', 'Chamando requestPermissions()...');
            const granted = await requestPermissions();

            clearTimeout(timeoutId);
            debugLog('UI', `Resultado: ${granted ? '✅ PERMITIDO' : '❌ NEGADO'}`);

            if (granted) {
                debugLog('UI', 'Sincronizando dados...');
                await syncHealthData();
                debugLog('UI', '✅ Sincronização completa!');
            }
        } catch (err) {
            debugLog('UI', `❌ ERRO: ${(err as Error).message}`);
            clearTimeout(timeoutId);
        } finally {
            setIsConnecting(false);
            debugLog('UI', '========== FIM ==========');
        }
    };

    const handleSync = async () => {
        await syncHealthData();
    };

    const handleCopyLogs = async () => {
        try {
            const logsText = debugLogs.join('\n');
            await navigator.clipboard.writeText(logsText);
            toast.success('Logs copiados! Envie para análise.');
        } catch (error) {
            toast.error('Falha ao copiar logs');
        }
    };

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
        <div className="page-scroll-container flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 pt-safe border-b border-border">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                )}
                <div className="flex-1">
                    <h1 className="text-xl font-bold">Conexões de Saúde</h1>
                    <p className="text-sm text-muted-foreground">
                        Sincronize dados de sono e recuperação
                    </p>
                </div>
                {isNative && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowDebugLogs(!showDebugLogs)}
                        >
                            <Bug className={`w-5 h-5 ${showDebugLogs ? 'text-primary' : ''}`} />
                        </Button>

                        {/* BUILD VERSION BADGE */}
                        <Badge variant="outline" className="ml-2 font-mono text-xs">
                            BUILD 26 ✨
                        </Badge>
                    </>
                )}
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-auto pb-24">
                {/* Debug Logs (se habilitado) */}
                {showDebugLogs && isNative && (
                    <Card className="border-yellow-500/30 bg-yellow-500/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Bug className="w-4 h-4" />
                                    Debug Logs
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleCopyLogs}
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        <Copy className="w-3 h-3" />
                                        Copiar
                                    </Button>
                                    <Button
                                        onClick={clearDebugLogs}
                                        size="sm"
                                        variant="outline"
                                    >
                                        Limpar
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-64 w-full">
                                <div className="space-y-1 font-mono text-xs">
                                    {debugLogs.length === 0 ? (
                                        <p className="text-muted-foreground">
                                            Nenhum log ainda. Clique em "Conectar" abaixo.
                                        </p>
                                    ) : (
                                        debugLogs.map((log, index) => {
                                            let bgColor = 'bg-muted/30';
                                            if (log.includes('❌') || log.includes('ERROR')) {
                                                bgColor = 'bg-red-500/20';
                                            } else if (log.includes('✅')) {
                                                bgColor = 'bg-green-500/20';
                                            } else if (log.includes('⚠️') || log.includes('⏰')) {
                                                bgColor = 'bg-yellow-500/20';
                                            }
                                            return (
                                                <div
                                                    key={index}
                                                    className={`p-2 rounded ${bgColor} whitespace-pre-wrap break-all`}
                                                >
                                                    {log}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                            <p className="text-xs text-muted-foreground mt-2">
                                💡 Clique "Copiar" e me envie os logs para análise
                            </p>
                        </CardContent>
                    </Card>
                )}

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
                            <div className="space-y-4">
                                {connectionTimeout && (
                                    <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-medium text-red-500">Conexão expirou</p>
                                            <p className="text-muted-foreground mt-1">
                                                Não foi possível conectar ao {healthServiceName}.
                                                Veja os logs acima (ícone 🐛) para mais detalhes.
                                            </p>
                                        </div>
                                    </div>
                                )}
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
                                    ) : connectionTimeout ? (
                                        <><RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente</>
                                    ) : (
                                        <><Smartphone className="w-4 h-4 mr-2" /> Conectar {healthServiceName}</>
                                    )}
                                </Button>
                            </div>
                        ) : (
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

                {/* Info Card */}
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
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default HealthConnectionsScreen;
