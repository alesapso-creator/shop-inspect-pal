import { openDB, type IDBPDatabase } from "idb";
import type { AcougueiroValor } from "./acougueiro-valor";

const DB_NAME = "acougueiro-de-valor";
const STORE = "reconhecimentos";
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

export async function listAcougueirosValor(): Promise<AcougueiroValor[]> {
  const db = await getDb();
  const items = (await db.getAll(STORE)) as AcougueiroValor[];
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getAcougueiroValor(id: string): Promise<AcougueiroValor | undefined> {
  const db = await getDb();
  return (await db.get(STORE, id)) as AcougueiroValor | undefined;
}

export async function saveAcougueiroValor(item: AcougueiroValor): Promise<void> {
  const db = await getDb();
  await db.put(STORE, { ...item, updatedAt: Date.now() });
}

export async function deleteAcougueiroValor(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}