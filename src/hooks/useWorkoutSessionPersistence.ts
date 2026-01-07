import { useState, useEffect, useCallback } from 'react';

// Session expiry time: 24 hours in milliseconds
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'cood_workout_session';
const DB_NAME = 'COODWorkoutDB';
const DB_VERSION = 1;
const STORE_NAME = 'workoutSessions';

export interface SetLog {
    setNumber: number;
    reps: number;
    weight: number;
    rpe: number;
}

export interface SavedWorkoutSession {
    id: string;
    workoutId: string | number;
    workoutName: string;
    userId: string;

    // Progress
    currentExerciseIndex: number;
    currentSetNumber: number;
    exerciseLogs: Record<number, SetLog[]>; // Map serialized as object
    totalVolume: number;

    // Time
    elapsedTime: number;
    startedAt: string;
    lastSavedAt: string;

    // Adaptations
    readinessLevel: string;
    modifiers: {
        volume: number;
        intensity: number;
        rest: number;
    };
}

// IndexedDB helper functions
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const useWorkoutSessionPersistence = (userId: string | undefined) => {
    const [savedSession, setSavedSession] = useState<SavedWorkoutSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasActiveSession, setHasActiveSession] = useState(false);

    // Load session on mount
    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        loadSession();
    }, [userId]);

    const loadSession = useCallback(async () => {
        if (!userId) return null;

        setIsLoading(true);
        try {
            // Try IndexedDB first
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);

            const request = store.get(userId);

            return new Promise<SavedWorkoutSession | null>((resolve) => {
                request.onsuccess = () => {
                    const session = request.result as SavedWorkoutSession | undefined;

                    if (session) {
                        // Check if session is expired
                        const lastSaved = new Date(session.lastSavedAt).getTime();
                        const now = Date.now();

                        if (now - lastSaved > SESSION_EXPIRY_MS) {
                            // Session expired, clear it
                            clearSession();
                            setSavedSession(null);
                            setHasActiveSession(false);
                            resolve(null);
                        } else {
                            setSavedSession(session);
                            setHasActiveSession(true);
                            resolve(session);
                        }
                    } else {
                        // Fallback to localStorage
                        const localData = localStorage.getItem(STORAGE_KEY);
                        if (localData) {
                            const parsed = JSON.parse(localData) as SavedWorkoutSession;
                            if (parsed.userId === userId) {
                                const lastSaved = new Date(parsed.lastSavedAt).getTime();
                                if (Date.now() - lastSaved <= SESSION_EXPIRY_MS) {
                                    setSavedSession(parsed);
                                    setHasActiveSession(true);
                                    resolve(parsed);
                                    return;
                                }
                            }
                        }
                        setSavedSession(null);
                        setHasActiveSession(false);
                        resolve(null);
                    }
                };

                request.onerror = () => {
                    console.error('Error loading session from IndexedDB');
                    resolve(null);
                };
            });
        } catch (error) {
            console.error('Error loading workout session:', error);

            // Fallback to localStorage
            try {
                const localData = localStorage.getItem(STORAGE_KEY);
                if (localData) {
                    const parsed = JSON.parse(localData) as SavedWorkoutSession;
                    if (parsed.userId === userId) {
                        const lastSaved = new Date(parsed.lastSavedAt).getTime();
                        if (Date.now() - lastSaved <= SESSION_EXPIRY_MS) {
                            setSavedSession(parsed);
                            setHasActiveSession(true);
                            return parsed;
                        }
                    }
                }
            } catch (e) {
                console.error('localStorage fallback failed:', e);
            }

            return null;
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const saveSession = useCallback(async (session: Omit<SavedWorkoutSession, 'id' | 'lastSavedAt'>) => {
        if (!userId) return;

        const fullSession: SavedWorkoutSession = {
            ...session,
            id: userId, // Use userId as key for easy lookup
            lastSavedAt: new Date().toISOString(),
        };

        try {
            // Save to IndexedDB
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            await new Promise<void>((resolve, reject) => {
                const request = store.put(fullSession);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            // Also save to localStorage as backup
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fullSession));

            setSavedSession(fullSession);
            setHasActiveSession(true);

            console.log('[Persistence] Session saved successfully');
        } catch (error) {
            console.error('Error saving workout session:', error);

            // Fallback to localStorage only
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fullSession));
                setSavedSession(fullSession);
                setHasActiveSession(true);
            } catch (e) {
                console.error('localStorage fallback failed:', e);
            }
        }
    }, [userId]);

    const clearSession = useCallback(async () => {
        if (!userId) return;

        try {
            // Clear from IndexedDB
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            await new Promise<void>((resolve, reject) => {
                const request = store.delete(userId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            // Clear from localStorage
            localStorage.removeItem(STORAGE_KEY);

            setSavedSession(null);
            setHasActiveSession(false);

            console.log('[Persistence] Session cleared');
        } catch (error) {
            console.error('Error clearing workout session:', error);

            // Try localStorage anyway
            localStorage.removeItem(STORAGE_KEY);
            setSavedSession(null);
            setHasActiveSession(false);
        }
    }, [userId]);

    const getSessionAge = useCallback((): string => {
        if (!savedSession) return '';

        const lastSaved = new Date(savedSession.lastSavedAt);
        const now = new Date();
        const diffMs = now.getTime() - lastSaved.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'agora mesmo';
        if (diffMins < 60) return `há ${diffMins} min`;
        if (diffHours < 24) return `há ${diffHours}h`;
        return 'há mais de 24h';
    }, [savedSession]);

    return {
        savedSession,
        hasActiveSession,
        isLoading,
        saveSession,
        clearSession,
        loadSession,
        getSessionAge,
    };
};
