import { dbAdd, dbDelete, dbGetAll, dbPut, StoreName } from "../lib/db";
import { Exam } from "../lib/exam";

export function fetchExamListService(): Promise<Exam[]> {
  return dbGetAll<Exam>(StoreName.Exams);
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
