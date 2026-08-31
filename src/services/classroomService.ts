import { dbAdd, dbDelete, dbGetAll, dbPut, StoreName } from "../lib/db";
import { Classroom } from "../lib/roster";

export function fetchClassroomListService(): Promise<Classroom[]> {
  return dbGetAll<Classroom>(StoreName.Classrooms);
}

export function createClassroomService(classroom: Classroom): Promise<void> {
  return dbAdd(StoreName.Classrooms, classroom);
}

export function updateClassroomService(classroom: Classroom): Promise<void> {
  return dbPut(StoreName.Classrooms, classroom);
}

export function deleteClassroomService(id: string): Promise<void> {
  return dbDelete(StoreName.Classrooms, id);
}
