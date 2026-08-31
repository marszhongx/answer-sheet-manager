import { ScanRecord } from "./grading";

export type Exam = {
  id: string;
  name: string;
  answerSheetId: string;
  classroomId: string;
  scanRecords: ScanRecord[];
  createdAt: string;
};
