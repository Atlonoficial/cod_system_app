/**
 * 🔗 REALTIME MANAGER CENTRALIZADO ([APP_NAME])
 * 
 * Sistema de gerenciamento unificado de Supabase Realtime Subscriptions
 * 
 * OBJETIVO: Reduzir canais e prevenir "Excesso de canais"
 * ARQUITETURA: Singleton pattern com multiplexing de canais
 */

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';
type TableName = string;
type EventType = PostgresChangeEvent;
type ListenerCallback = (payload: any) => void;

interface ChannelConfig {
    table: TableName;
    schema?: string;
    filter?: string;
}

interface ListenerKey {
    id: string;
    table: TableName;
    event: EventType;
    filter?: string;
    callback: ListenerCallback;
}

class RealtimeManager {
    private static instance: RealtimeManager;
    private globalChannel: RealtimeChannel | null = null;
    private listeners = new Map<string, Set<ListenerCallback>>();
    private listenerMetadata = new Map<string, ListenerKey>();
    private nextListenerId = 0;
    private isSubscribed = false; // Build 14: Prevenir subscriptions redundantes

    private constructor() {
        logger.info('RealtimeManager', 'Inicializado (Single Channel Mode)');
    }

    static getInstance(): RealtimeManager {
        if (!RealtimeManager.instance) {
            RealtimeManager.instance = new RealtimeManager();
        }
        return RealtimeManager.instance;
    }

    private getListenerKey(table: TableName, event: EventType, filter?: string): string {
        return `${table}:${event}${filter ? `:${filter}` : ''}`;
    }

    private async reconnect(): Promise<void> {
        logger.info('RealtimeManager', '🔄 Iniciando reconexão...');

        if (this.globalChannel) {
            await supabase.removeChannel(this.globalChannel);
            this.globalChannel = null;
        }

        const channel = this.createChannelInstance();

        const uniqueListeners = new Map<string, ListenerKey>();
        this.listenerMetadata.forEach(meta => {
            const key = this.getListenerKey(meta.table, meta.event, meta.filter);
            if (!uniqueListeners.has(key)) {
                uniqueListeners.set(key, meta);
            }
        });

        logger.info('RealtimeManager', `🔄 Re-anexando ${uniqueListeners.size} grupos de listeners...`);

        uniqueListeners.forEach(meta => {
            logger.info('RealtimeManager', `   📌 Anexando: ${meta.table} | ${meta.event} | ${meta.filter || 'Sem filtro'}`);
            this.addPostgresListener(channel, { table: meta.table, filter: meta.filter }, meta.event, meta.callback);
        });

        this.isSubscribed = false; // Reset flag before reconnect
        this.subscribeToChannel(channel);
    }

    private createChannelInstance(): RealtimeChannel {
        logger.info('RealtimeManager', 'Criando instância do channel');
        const channelId = `global-student-realtime-${Math.random().toString(36).substring(7)}`;
        this.globalChannel = supabase.channel(channelId, {
            config: {
                // broadcast: { self: true },
            },
        });
        return this.globalChannel;
    }

    private subscribeToChannel(channel: RealtimeChannel) {
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                this.isSubscribed = true; // Build 14: Marcar como conectado
                logger.info('RealtimeManager', '✅ Channel Global conectado');
            } else if (status === 'CHANNEL_ERROR') {
                this.isSubscribed = false; // Build 14: Reset flag
                logger.error('RealtimeManager', '❌ Erro no Channel Global');
                logger.warn('RealtimeManager', '⚠️ Tentando reconectar em 5s...');
                setTimeout(() => {
                    this.reconnect();
                }, 5000);
            } else if (status === 'TIMED_OUT') {
                this.isSubscribed = false; // Build 14: Reset flag
                logger.error('RealtimeManager', '⏱️ Timeout no Channel Global');
                setTimeout(() => {
                    this.reconnect();
                }, 5000);
            }
        });
    }

    private getGlobalChannel(): RealtimeChannel {
        if (this.globalChannel) {
            return this.globalChannel;
        }
        return this.createChannelInstance();
    }

    private addPostgresListener(
        channel: RealtimeChannel,
        config: ChannelConfig,
        event: EventType,
        callback: ListenerCallback
    ) {
        const { table, schema = 'public', filter } = config;

        const changeConfig: any = {
            event: event === '*' ? '*' : (event as any),
            schema,
            table,
        };

        if (filter) {
            changeConfig.filter = filter;
        }

        channel.on(
            'postgres_changes' as any,
            changeConfig,
            (payload: any) => {
                const key = this.getListenerKey(table, event, filter);
                const eventListeners = this.listeners.get(key);

                if (eventListeners) {
                    eventListeners.forEach(cb => {
                        try {
                            cb(payload);
                        } catch (error) {
                            logger.error('RealtimeManager', 'Erro ao executar listener', error);
                        }
                    });
                }
            }
        );
    }

    subscribe(
        table: TableName,
        event: EventType,
        callback: ListenerCallback,
        filter?: string
    ): string {
        const listenerId = `listener-${this.nextListenerId++}`;
        const key = this.getListenerKey(table, event, filter);

        this.listenerMetadata.set(listenerId, { id: listenerId, table, event, filter, callback });

        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());

            const channel = this.getGlobalChannel();
            this.addPostgresListener(channel, { table, filter }, event, callback);

            // Build 14: Só subscribe se ainda não estiver subscrito
            if (!this.isSubscribed) {
                this.subscribeToChannel(channel);
            }
        }

        this.listeners.get(key)!.add(callback);

        logger.info('RealtimeManager', `Listener registrado: ${table}.${event} [${listenerId}]`);

        return listenerId;
    }

    unsubscribe(listenerId: string): void {
        const metadata = this.listenerMetadata.get(listenerId);

        if (!metadata) return;

        const key = this.getListenerKey(metadata.table, metadata.event, metadata.filter);
        const eventListeners = this.listeners.get(key);

        if (eventListeners) {
            eventListeners.delete(metadata.callback);

            if (eventListeners.size === 0) {
                this.listeners.delete(key);
            }
        }

        this.listenerMetadata.delete(listenerId);
        logger.info('RealtimeManager', `Listener removido: ${listenerId}`);
    }

    unsubscribeAll(): void {
        if (this.globalChannel) {
            supabase.removeChannel(this.globalChannel);
            this.globalChannel = null;
        }
        this.listeners.clear();
        this.listenerMetadata.clear();
        logger.info('RealtimeManager', 'Limpeza completa realizada');
    }
}

export const realtimeManager = RealtimeManager.getInstance();
