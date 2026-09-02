const DB_NAME = "answer-sheet-manager";
const DB_VERSION = 1;

export enum StoreName {
  AnswerSheets = "AnswerSheets",
  Classrooms = "Classrooms",
  Exams = "Exams",
}

let dbPromise: Promise<IDBDatabase> | undefined;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of Object.values(StoreName)) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }
    };
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => {
      dbPromise = undefined;
      reject(request.error);
    });
  });
  return dbPromise;
}

function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const request = run(transaction.objectStore(storeName));
        request.addEventListener("success", () => resolve(request.result));
        request.addEventListener("error", () => reject(request.error));
        transaction.addEventListener("abort", () => {
          dbPromise = undefined;
          reject(transaction.error ?? new Error("数据库事务中断，请重试"));
        });
      }),
  );
}

export function dbGetAll<T>(storeName: StoreName): Promise<T[]> {
  return withStore(storeName, "readonly", (store) => store.getAll());
}

export function dbAdd<T extends { id: string }>(storeName: StoreName, record: T): Promise<void> {
  return withStore(storeName, "readwrite", (store) => store.add(record)).then(() => undefined);
}

export function dbPut<T extends { id: string }>(storeName: StoreName, record: T): Promise<void> {
  return withStore(storeName, "readwrite", (store) => store.put(record)).then(() => undefined);
}

export function dbDelete(storeName: StoreName, id: string): Promise<void> {
  return withStore(storeName, "readwrite", (store) => store.delete(id)).then(() => undefined);
}

export function dbClear(storeName: StoreName): Promise<void> {
  return withStore(storeName, "readwrite", (store) => store.clear()).then(() => undefined);
}
