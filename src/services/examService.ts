import { dbAdd, dbDelete, dbGetAll, dbGetAllByIndex, StoreName, withStores } from "../lib/db";
import { Exam } from "../lib/exam";
import { newId } from "../lib/id";
import { AnswerSheet } from "../lib/omr";
import { Classroom } from "../lib/roster";

export function fetchExamListService(): Promise<Exam[]> {
  return dbGetAll<Exam>(StoreName.Exams);
}

// 按关联 id 查询考试，走 answerSheetId / classroomId 索引，避免 getAll 后内存过滤（F5）。
export function fetchExamsByAnswerSheetService(answerSheetId: string): Promise<Exam[]> {
  return dbGetAllByIndex<Exam>(StoreName.Exams, "answerSheetId", answerSheetId);
}

export function fetchExamsByClassroomService(classroomId: string): Promise<Exam[]> {
  return dbGetAllByIndex<Exam>(StoreName.Exams, "classroomId", classroomId);
}

export function createExamService(exam: Exam): Promise<void> {
  return dbAdd(StoreName.Exams, exam);
}

export function updateExamService(exam: Exam): Promise<void> {
  return withStores([StoreName.Exams], "readwrite", (stores, abort) => {
    const store = stores[StoreName.Exams];
    const request = store.get(exam.id);
    request.addEventListener("success", () => {
      const current = request.result as Exam | undefined;
      if (
        current?.scanRecords.length &&
        (current.name !== exam.name ||
          current.answerSheetId !== exam.answerSheetId ||
          current.classroomId !== exam.classroomId ||
          exam.scanRecords.length < current.scanRecords.length)
      ) {
        abort(new Error("已有阅卷记录，不能修改考试信息或移除成绩"));
        return;
      }
      store.put(exam);
    });
  });
}

// 校验和写入共享 Exams 的读写锁，防止另一标签页刚保存成绩后仍能修改评分依据。
export function updateExamResource(
  storeName: StoreName.AnswerSheets | StoreName.Classrooms,
  record: AnswerSheet | Classroom,
): Promise<void> {
  const index = storeName === StoreName.AnswerSheets ? "answerSheetId" : "classroomId";
  return withStores([StoreName.Exams, storeName], "readwrite", (stores, abort) => {
    const request = stores[StoreName.Exams].index(index).getAll(record.id);
    request.addEventListener("success", () => {
      if ((request.result as Exam[]).some((exam) => exam.scanRecords.length > 0)) {
        abort(new Error("已有阅卷记录，不能修改考试答题卡或班级"));
        return;
      }
      stores[storeName].put(record);
    });
  });
}

export function deleteExamService(id: string): Promise<void> {
  return dbDelete(StoreName.Exams, id);
}

// 原子创建“考试 + 答题卡副本 + 班级副本”：三者同一事务写入，任一失败全部回滚（F1）。
export async function createExamWithCopies(
  sourceSheet: AnswerSheet,
  sourceClassroom: Classroom,
  examName: string,
): Promise<Exam> {
  const sheetCopy: AnswerSheet = {
    ...sourceSheet,
    id: newId(),
    isTemplate: false,
    sections: sourceSheet.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => ({ ...question })),
    })),
  };
  const classroomCopy: Classroom = {
    ...sourceClassroom,
    id: newId(),
    isTemplate: false,
    students: sourceClassroom.students.map((student) => ({ ...student })),
  };
  const exam: Exam = {
    id: newId(),
    name: examName,
    answerSheetId: sheetCopy.id,
    classroomId: classroomCopy.id,
    scanRecords: [],
    createdAt: new Date().toISOString(),
  };
  await withStores(
    [StoreName.AnswerSheets, StoreName.Classrooms, StoreName.Exams],
    "readwrite",
    (stores) => {
      stores[StoreName.AnswerSheets].add(sheetCopy);
      stores[StoreName.Classrooms].add(classroomCopy);
      stores[StoreName.Exams].add(exam);
    },
  );
  return exam;
}

// 原子删除考试及其关联的答题卡/班级副本（F1）。
export function deleteExamWithCopies(
  examId: string,
  answerSheetId: string,
  classroomId: string,
): Promise<void> {
  return withStores(
    [StoreName.Exams, StoreName.AnswerSheets, StoreName.Classrooms],
    "readwrite",
    (stores) => {
      stores[StoreName.Exams].delete(examId);
      stores[StoreName.AnswerSheets].delete(answerSheetId);
      stores[StoreName.Classrooms].delete(classroomId);
    },
  );
}
