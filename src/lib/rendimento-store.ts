import { openDB, type IDBPDatabase } from "idb";
import type { Rendimento } from "./rendimento";

const DB_NAME = "rendimento-bovino";
const STORE = "rendimentos";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function listRendimentos(): Promise<Rendimento[]> {
  const db = await getDb();
  const all = (await db.getAll(STORE)) as Rendimento[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getRendimento(id: string): Promise<Rendimento | undefined> {
  const db = await getDb();
  return (await db.get(STORE, id)) as Rendimento | undefined;
}

export async function saveRendimento(item: Rendimento): Promise<void> {
  const db = await getDb();
  await db.put(STORE, { ...item, updatedAt: Date.now() });
}

export async function deleteRendimento(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}
