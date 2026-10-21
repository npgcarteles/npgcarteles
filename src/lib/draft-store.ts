// Keeps the configured design (with images) in the browser while the user signs in.
import type { OrderConfig } from "./orders.shared";

export type Draft = { config: OrderConfig; preview: Blob; logo: Blob | null; savedAt: number };

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("npg-studio", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("draft");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const r = fn(d.transaction("draft", mode).objectStore("draft"));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export const saveDraft = (d: Draft) => tx("readwrite", (s) => s.put(d, "current"));
export const loadDraft = () => tx<Draft | undefined>("readonly", (s) => s.get("current"));
export const clearDraft = () => tx("readwrite", (s) => s.delete("current"));
