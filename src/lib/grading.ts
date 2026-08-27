import { AnswerCardTemplate, Option } from "./omr";

export type GradedStudent = {
  name: string;
  fileName: string;
  answers: Array<Option | null>;
  wrong: boolean[];
  correctCount: number;
  score: number;
  totalScore: number;
  confidence: number[];
};

export const POINTS_PER_QUESTION = 5;

export function gradeAnswers(
  template: AnswerCardTemplate,
  studentName: string,
  fileName: string,
  answers: Array<Option | null>,
  confidence: number[],
): GradedStudent {
  const wrong = answers.map((answer, index) => answer !== template.answers[index]);
  const correctCount = wrong.filter((value) => !value).length;
  return {
    name: studentName.trim() || "未命名学生",
    fileName,
    answers,
    wrong,
    confidence,
    correctCount,
    score: correctCount * POINTS_PER_QUESTION,
    totalScore: template.questionCount * POINTS_PER_QUESTION,
  };
}

export function questionRates(records: GradedStudent[], questionCount: number): number[] {
  if (records.length === 0) return Array.from({ length: questionCount }, () => 0);
  return Array.from({ length: questionCount }, (_, index) =>
    Math.round((records.filter((record) => !record.wrong[index]).length / records.length) * 100),
  );
}

export function averageScore(records: GradedStudent[]): number {
  return records.length
    ? records.reduce((sum, record) => sum + record.score, 0) / records.length
    : 0;
}

export function toCSV(template: AnswerCardTemplate, records: GradedStudent[]): string {
  const header = [
    "姓名",
    ...Array.from({ length: template.questionCount }, (_, index) => `第${index + 1}题`),
    "得分",
    "总分",
  ];
  const rows = records.map((record) => [
    record.name,
    ...record.answers.map((answer) => answer ?? "未识别"),
    record.score,
    record.totalScore,
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.join(",")).join("\n")}`;
}

export function downloadCSV(fileName: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
