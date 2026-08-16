import { openDB, type IDBPDatabase } from "idb";
import type { Inspection } from "./inspection";

const DB_NAME = "inspecoes-loja";
const STORE = "inspecoes";

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

export async function listInspections(): Promise<Inspection[]> {
  const db = await getDb();
  const all = (await db.getAll(STORE)) as Inspection[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getInspection(id: string): Promise<Inspection | undefined> {
  const db = await getDb();
  return (await db.get(STORE, id)) as Inspection | undefined;
}

export async function saveInspection(inspection: Inspection): Promise<void> {
  const db = await getDb();
  await db.put(STORE, { ...inspection, updatedAt: Date.now() });
}

export async function deleteInspection(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}
