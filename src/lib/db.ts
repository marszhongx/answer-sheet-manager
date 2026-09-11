const DB_NAME = "answer-sheet-manager";
const DB_VERSION = 2;

export enum StoreName {
  AnswerSheets = "AnswerSheets",
  Classrooms = "Classrooms",
  Exams = "Exams",
}

let dbPromise: Promise<IDBDatabase> | undefined;

// —— 数据库迁移 ——
// 迁移范式：每升一版，在 switch 中新增对应 oldVersion 的分支（或复用下方幂等迁移函数），
// 并把 DB_VERSION 加 1。onupgradeneeded 只会在版本号变大时触发。
// 未来加 v3（例如新增 Settings store）时：
//   1. DB_VERSION 改为 3；
//   2. 在 createStores 下方新增 `case 2:` 分支，执行 v2 → v3 的建表/建索引逻辑。
function createStores(db: IDBDatabase): void {
  for (const store of Object.values(StoreName)) {
    if (!db.objectStoreNames.contains(store)) {
      db.createObjectStore(store, { keyPath: "id" });
    }
  }
}

// v1 → v2 迁移：为 Exams store 建 answerSheetId / classroomId 索引，供按考试关联查询。
// 幂等：用 indexNames.contains 守卫，新库（v0）与旧库（v1）升级都会走到这里。
function createExamsIndexes(transaction: IDBTransaction): void {
  const exams = transaction.objectStore(StoreName.Exams);
  if (!exams.indexNames.contains("answerSheetId")) {
    exams.createIndex("answerSheetId", "answerSheetId");
  }
  if (!exams.indexNames.contains("classroomId")) {
    exams.createIndex("classroomId", "classroomId");
  }
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = request.result;
      const transaction = request.transaction;
      if (!transaction) return;
      switch (event.oldVersion) {
        case 0:
          createStores(db);
          break;
        default:
          break;
      }
      // 索引迁移与建库共用同一升级入口，新库与旧库升级后索引都齐备
      createExamsIndexes(transaction);
    };
    request.addEventListener("success", () => {
      const db = request.result;
      // 其他标签页升级数据库时（versionchange）关闭连接并清缓存，下次访问重新打开
      db.addEventListener("versionchange", () => {
        db.close();
        dbPromise = undefined;
      });
      resolve(db);
    });
    request.addEventListener("error", () => {
      // 仅 open 失败才重置缓存，让后续调用有机会重试
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
        let result: T;
        let settled = false;
        const settleError = (error: unknown) => {
          if (settled) return;
          settled = true;
          reject(error);
        };
        const request = run(transaction.objectStore(storeName));
        request.addEventListener("success", () => {
          result = request.result;
        });
        request.addEventListener("error", () =>
          settleError(request.error ?? new Error("数据库请求失败，请重试")),
        );
        transaction.addEventListener("complete", () => {
          if (settled) return;
          settled = true;
          resolve(result);
        });
        transaction.addEventListener("abort", () =>
          settleError(transaction.error ?? new Error("数据库事务中断，请重试")),
        );
        transaction.addEventListener("error", () =>
          settleError(transaction.error ?? new Error("数据库事务失败，请重试")),
        );
      }),
  );
}

// 单事务内操作多个 store。回调必须同步排队所有 IDBRequest，避免跨 await 后事务自动提交；
// run 抛错时主动 abort，保证多个 store 的写要么全部落盘、要么全部回滚（F1 原子性）。
export function withStores(
  storeNames: StoreName[],
  mode: IDBTransactionMode,
  run: (stores: Record<StoreName, IDBObjectStore>) => void,
): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeNames, mode);
        const stores = {} as Record<StoreName, IDBObjectStore>;
        for (const name of storeNames) stores[name] = transaction.objectStore(name);
        let settled = false;
        let runError: unknown;
        const settle = (error?: unknown) => {
          if (settled) return;
          settled = true;
          if (error) reject(error);
          else resolve();
        };
        transaction.addEventListener("complete", () => settle());
        transaction.addEventListener("abort", () =>
          settle(runError ?? transaction.error ?? new Error("数据库事务中断，请重试")),
        );
        transaction.addEventListener("error", () =>
          settle(runError ?? transaction.error ?? new Error("数据库事务中断，请重试")),
        );
        try {
          run(stores);
        } catch (error) {
          runError = error;
          try {
            transaction.abort();
          } catch {
            settle(error);
          }
        }
      }),
  );
}

export function dbGetAll<T>(storeName: StoreName): Promise<T[]> {
  return withStore(storeName, "readonly", (store) => store.getAll());
}

export function dbGetAllByIndex<T>(
  storeName: StoreName,
  indexName: string,
  key: string,
): Promise<T[]> {
  return withStore(storeName, "readonly", (store) => store.index(indexName).getAll(key));
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
