import { GradedStudent } from "./grading";
import { AnswerCardTemplate } from "./omr";
import { ClassRoster } from "./roster";

export type Exam = {
  id: string;
  name: string;
  template: AnswerCardTemplate;
  classroom: ClassRoster;
  records: GradedStudent[];
  createdAt: string;
};
