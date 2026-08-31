import { GradedStudent } from "./grading";
import { AnswerSheet } from "./omr";
import { Classroom } from "./roster";

export type Exam = {
  id: string;
  name: string;
  answerSheet: AnswerSheet;
  classroom: Classroom;
  records: GradedStudent[];
  createdAt: string;
};
