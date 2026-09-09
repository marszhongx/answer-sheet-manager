import {
  dbAdd,
  dbDelete,
  dbGetAll,
  dbGetAllByIndex,
  dbPut,
  StoreName,
  withStores,
} from "../lib/db";
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
  return dbPut(StoreName.Exams, exam);
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
