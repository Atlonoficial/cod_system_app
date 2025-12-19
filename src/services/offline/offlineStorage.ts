// Writing a native wrapper is safer to avoid "npm install" issues if the user environment is strict.

export interface OfflineAction {
    id?: number;
    type: 'LOG_WEIGHT' | 'LOG_MEAL' | 'LOG_WORKOUT' | 'ADD_CUSTOM_MEAL';
    payload: any;
    userId: string;
    timestamp: number;
}

class OfflineStorage {
    private dbName = 'cood-system-db';
    private version = 1;
    private db: IDBDatabase | null = null;

    constructor() {
        this.initDB();
    }

    private async initDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create stores if they don't exist
                if (!db.objectStoreNames.contains('keyval')) {
                    db.createObjectStore('keyval');
                }
                if (!db.objectStoreNames.contains('actions')) {
                    db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async set(key: string, value: any): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['keyval'], 'readwrite');
            const store = transaction.objectStore('keyval');
            const request = store.put(value, key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async get<T>(key: string): Promise<T | null> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['keyval'], 'readonly');
            const store = transaction.objectStore('keyval');
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    async remove(key: string): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['keyval'], 'readwrite');
            const store = transaction.objectStore('keyval');
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async addAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['actions'], 'readwrite');
            const store = transaction.objectStore('actions');
            const request = store.add({ ...action, timestamp: Date.now() });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async getPendingActions(): Promise<OfflineAction[]> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['actions'], 'readonly');
            const store = transaction.objectStore('actions');
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    async removeAction(id: number): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['actions'], 'readwrite');
            const store = transaction.objectStore('actions');
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

export const offlineStorage = new OfflineStorage();
