import { dbAdd, dbDelete, dbGetAll, StoreName } from "../lib/db";
import { AnswerSheet } from "../lib/omr";
import { updateExamResource } from "./examService";

export function fetchAnswerSheetListService(): Promise<AnswerSheet[]> {
  return dbGetAll<AnswerSheet>(StoreName.AnswerSheets);
}

export function createAnswerSheetService(answerSheet: AnswerSheet): Promise<void> {
  return dbAdd(StoreName.AnswerSheets, answerSheet);
}

export function updateAnswerSheetService(answerSheet: AnswerSheet): Promise<void> {
  return updateExamResource(StoreName.AnswerSheets, answerSheet);
}

export function deleteAnswerSheetService(id: string): Promise<void> {
  return dbDelete(StoreName.AnswerSheets, id);
}
