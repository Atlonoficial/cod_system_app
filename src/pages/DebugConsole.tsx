/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COD System - Debug Console Page (iPhone Debug)
 * Version: 1.0.0 | Build: 20
 * ═══════════════════════════════════════════════════════════════════════════
 * Página de debug interna para visualizar logs SEM precisar de Mac
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    getDebugLogs,
    clearDebugLogs,
    subscribeToLogs,
    exportLogsAsText,
    downloadLogs
} from '@/lib/debugLogger';
import { Copy, Trash2, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

export const DebugConsolePage: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [autoScroll, setAutoScroll] = useState(true);

    useEffect(() => {
        // Load initial logs
        setLogs(getDebugLogs());

        // Subscribe to updates
        const unsubscribe = subscribeToLogs((newLogs) => {
            setLogs(newLogs);
        });

        return unsubscribe;
    }, []);

    const handleClear = () => {
        clearDebugLogs();
        toast.success('Logs limpos');
    };

    const handleCopy = async () => {
        try {
            const text = exportLogsAsText();
            await navigator.clipboard.writeText(text);
            toast.success('Logs copiados para área de transferência');
        } catch (error) {
            toast.error('Falha ao copiar logs');
        }
    };

    const handleDownload = async () => {
        try {
            const uri = await downloadLogs();
            toast.success(`Logs salvos em: ${uri}`);
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <h1 className="text-2xl font-bold">🐛 Debug Console</h1>
                <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{platform}</Badge>
                    <Badge variant={isNative ? 'default' : 'secondary'}>
                        {isNative ? 'Native' : 'Web'}
                    </Badge>
                    <Badge variant="outline">{logs.length} logs</Badge>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-b border-border flex gap-2 flex-wrap">
                <Button
                    onClick={handleClear}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    Limpar
                </Button>
                <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <Copy className="w-4 h-4" />
                    Copiar
                </Button>
                {isNative && (
                    <Button
                        onClick={handleDownload}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Salvar
                    </Button>
                )}
                <Button
                    onClick={() => setAutoScroll(!autoScroll)}
                    variant={autoScroll ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
                </Button>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4">
                    {logs.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <p>Nenhum log ainda</p>
                            <p className="text-sm mt-2">
                                Use o app e os logs aparecerão aqui automaticamente
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1 font-mono text-xs">
                            {logs.map((log, index) => {
                                // Color coding based on content
                                let bgColor = 'bg-muted/30';
                                if (log.includes('❌') || log.includes('ERROR')) {
                                    bgColor = 'bg-red-500/10';
                                } else if (log.includes('✅') || log.includes('SUCCESS')) {
                                    bgColor = 'bg-green-500/10';
                                } else if (log.includes('⚠️') || log.includes('WARN')) {
                                    bgColor = 'bg-yellow-500/10';
                                } else if (log.includes('🔍') || log.includes('DEBUG')) {
                                    bgColor = 'bg-blue-500/10';
                                }

                                return (
                                    <div
                                        key={index}
                                        className={`p-2 rounded ${bgColor} whitespace-pre-wrap break-all`}
                                    >
                                        {log}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-border bg-muted/20">
                <p className="text-xs text-muted-foreground text-center">
                    💡 Dica: Clique em "Copiar" e me envie os logs para análise
                </p>
            </div>
        </div>
    );
};

export default DebugConsolePage;
