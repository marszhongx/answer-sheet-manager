import { GradedStudent } from "./grading";

export type Exam = {
  id: string;
  name: string;
  answerSheetId: string;
  classroomId: string;
  records: GradedStudent[];
  createdAt: string;
};
