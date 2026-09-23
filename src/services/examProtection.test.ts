import { beforeEach, describe, expect, it } from "vitest";
import { dbClear, dbGetAll, dbPut, StoreName } from "../lib/db";
import { Exam } from "../lib/exam";
import { AnswerSheet } from "../lib/omr";
import { Classroom } from "../lib/roster";
import { updateAnswerSheetService } from "./answerSheetService";
import { updateClassroomService } from "./classroomService";
import { updateExamService } from "./examService";

const sheet: AnswerSheet = {
  id: "sheet",
  name: "答题卡",
  subject: "数学",
  isTemplate: false,
  candidateNumberLength: 2,
  createdAt: "2025-01-01",
  sections: [
    {
      id: "s1",
      name: "第一大题",
      optionCount: 4,
      pointsPerQuestion: 5,
      questions: [{ id: "q1", answer: "A" }],
    },
  ],
};
const classroom: Classroom = {
  id: "class",
  name: "一班",
  isTemplate: false,
  students: [{ id: "student", name: "张同学", studentNumber: "01" }],
};
const exam: Exam = {
  id: "exam",
  name: "考试",
  answerSheetId: sheet.id,
  classroomId: classroom.id,
  createdAt: "2025-01-01",
  scanRecords: [],
};
const gradedExam: Exam = {
  ...exam,
  scanRecords: [{ studentNumber: "01", fileName: "paper.jpg", answers: ["A"], confidence: [1] }],
};

beforeEach(async () => {
  await Promise.all(Object.values(StoreName).map((store) => dbClear(store)));
  await dbPut(StoreName.AnswerSheets, sheet);
  await dbPut(StoreName.Classrooms, classroom);
  await dbPut(StoreName.Exams, exam);
});

describe("graded exam write protection", () => {
  it("rejects answer key changes without changing stored answers", async () => {
    await dbPut(StoreName.Exams, gradedExam);
    const changed = {
      ...sheet,
      sections: [{ ...sheet.sections[0]!, questions: [{ id: "q1", answer: "B" as const }] }],
    };
    await expect(updateAnswerSheetService(changed)).rejects.toThrow(/阅卷记录/);
    expect(await dbGetAll(StoreName.AnswerSheets)).toEqual([sheet]);
  });

  it("rejects roster changes without changing stored students", async () => {
    await dbPut(StoreName.Exams, gradedExam);
    await expect(updateClassroomService({ ...classroom, students: [] })).rejects.toThrow(
      /阅卷记录/,
    );
    expect(await dbGetAll(StoreName.Classrooms)).toEqual([classroom]);
  });

  it("allows answer key and roster edits before any grading", async () => {
    await updateAnswerSheetService({ ...sheet, name: "新答题卡" });
    await updateClassroomService({ ...classroom, name: "二班" });
    expect((await dbGetAll<AnswerSheet>(StoreName.AnswerSheets))[0]?.name).toBe("新答题卡");
    expect((await dbGetAll<Classroom>(StoreName.Classrooms))[0]?.name).toBe("二班");
  });

  it("does not block an unrelated template when an exam has been graded", async () => {
    await dbPut(StoreName.Exams, gradedExam);
    const template = { ...sheet, id: "template", isTemplate: true };
    await dbPut(StoreName.AnswerSheets, template);
    await expect(
      updateAnswerSheetService({ ...template, name: "新模板" }),
    ).resolves.toBeUndefined();
  });

  it("sees a grading transaction queued before an answer key update", async () => {
    const grading = updateExamService(gradedExam);
    const editing = updateAnswerSheetService({ ...sheet, name: "不应保存" });
    await expect(editing).rejects.toThrow(/阅卷记录/);
    await grading;
    expect(await dbGetAll(StoreName.AnswerSheets)).toEqual([sheet]);
  });

  it("does not let a stale metadata edit erase grading records", async () => {
    await dbPut(StoreName.Exams, gradedExam);
    await expect(updateExamService({ ...exam, name: "新考试名" })).rejects.toThrow(/阅卷记录/);
    expect(await dbGetAll(StoreName.Exams)).toEqual([gradedExam]);
  });

  it("rejects an unchanged stale form save after grading has started", async () => {
    await dbPut(StoreName.Exams, gradedExam);
    await expect(updateExamService(exam)).rejects.toThrow(/阅卷记录/);
    expect(await dbGetAll(StoreName.Exams)).toEqual([gradedExam]);
  });

  it("still allows saving another grading record", async () => {
    await dbPut(StoreName.Exams, gradedExam);
    const next = {
      ...gradedExam,
      scanRecords: [
        ...gradedExam.scanRecords,
        { studentNumber: "02", fileName: "second.jpg", answers: ["B" as const], confidence: [1] },
      ],
    };
    await updateExamService(next);
    expect(await dbGetAll(StoreName.Exams)).toEqual([next]);
  });
});
