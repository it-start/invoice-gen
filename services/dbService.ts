
import { ChatSession } from '../types';

const DB_NAME = 'ownima_chat_db';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

export const dbService = {
  open: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      // Check if IndexedDB is supported
      if (!window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Create object store with 'id' as the key path (Reservation ID)
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  },

  getAllSessions: async (): Promise<ChatSession[]> => {
    try {
      const db = await dbService.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("IDB Get All Error", e);
      return [];
    }
  },

  saveSession: async (session: ChatSession): Promise<void> => {
    try {
      const db = await dbService.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(session);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("IDB Save Error", e);
    }
  },
  
  deleteSession: async (id: string): Promise<void> => {
      try {
        const db = await dbService.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
      } catch (e) {
          console.error("IDB Delete Error", e);
      }
  }
};
