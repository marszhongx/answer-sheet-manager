import { GradedStudent } from "./grading";

export type Exam = {
  id: string;
  name: string;
  templateId: string;
  classId: string;
  records: GradedStudent[];
  createdAt: string;
};
