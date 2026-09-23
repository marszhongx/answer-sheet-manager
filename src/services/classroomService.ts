import { dbAdd, dbDelete, dbGetAll, StoreName } from "../lib/db";
import { Classroom } from "../lib/roster";
import { updateExamResource } from "./examService";

export function fetchClassroomListService(): Promise<Classroom[]> {
  return dbGetAll<Classroom>(StoreName.Classrooms);
}

export function createClassroomService(classroom: Classroom): Promise<void> {
  return dbAdd(StoreName.Classrooms, classroom);
}

export function updateClassroomService(classroom: Classroom): Promise<void> {
  return updateExamResource(StoreName.Classrooms, classroom);
}

export function deleteClassroomService(id: string): Promise<void> {
  return dbDelete(StoreName.Classrooms, id);
}
