import { beforeEach, describe, expect, it } from "vitest";
import { dbClear, dbGetAll, StoreName, withStores } from "./db";

beforeEach(async () => {
  await Promise.all([
    dbClear(StoreName.AnswerSheets),
    dbClear(StoreName.Classrooms),
    dbClear(StoreName.Exams),
  ]);
});

describe("withStores 原子事务", () => {
  it("中途抛错时回滚所有 store，不落盘", async () => {
    await expect(
      withStores(
        [StoreName.AnswerSheets, StoreName.Classrooms, StoreName.Exams],
        "readwrite",
        (stores) => {
          stores[StoreName.AnswerSheets].add({ id: "sheet-1", name: "答题卡" });
          stores[StoreName.Classrooms].add({ id: "class-1", name: "班级" });
          throw new Error("模拟中途失败");
        },
      ),
    ).rejects.toThrow("模拟中途失败");

    const [sheets, classrooms, exams] = await Promise.all([
      dbGetAll(StoreName.AnswerSheets),
      dbGetAll(StoreName.Classrooms),
      dbGetAll(StoreName.Exams),
    ]);
    expect(sheets).toHaveLength(0);
    expect(classrooms).toHaveLength(0);
    expect(exams).toHaveLength(0);
  });

  it("无异常时三个 store 全部落盘", async () => {
    await withStores(
      [StoreName.AnswerSheets, StoreName.Classrooms, StoreName.Exams],
      "readwrite",
      (stores) => {
        stores[StoreName.AnswerSheets].add({ id: "sheet-1", name: "答题卡" });
        stores[StoreName.Classrooms].add({ id: "class-1", name: "班级" });
        stores[StoreName.Exams].add({ id: "exam-1", name: "考试" });
      },
    );

    const [sheets, classrooms, exams] = await Promise.all([
      dbGetAll(StoreName.AnswerSheets),
      dbGetAll(StoreName.Classrooms),
      dbGetAll(StoreName.Exams),
    ]);
    expect(sheets).toHaveLength(1);
    expect(classrooms).toHaveLength(1);
    expect(exams).toHaveLength(1);
  });
});
