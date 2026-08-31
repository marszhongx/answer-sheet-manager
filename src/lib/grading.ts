import { AnswerCardTemplate, Option, questionPoints } from "./omr";

export type GradedStudent = {
  name: string;
  studentNumber: string;
  className: string;
  fileName: string;
  answers: Array<Option | null>;
  wrong: boolean[];
  correctCount: number;
  score: number;
  totalScore: number;
  confidence: number[];
};

export function gradeAnswers(
  template: AnswerCardTemplate,
  studentName: string,
  fileName: string,
  answers: Array<Option | null>,
  confidence: number[],
  studentNumber = "",
  className = "",
): GradedStudent {
  const wrong = answers.map((answer, index) => answer !== template.answers[index]);
  const correctCount = wrong.filter((value) => !value).length;
  const points = questionPoints(template);
  const score = wrong.reduce((sum, value, index) => sum + (value ? 0 : points[index]), 0);
  return {
    name: studentName.trim() || "未命名学生",
    studentNumber,
    className,
    fileName,
    answers,
    wrong,
    confidence,
    correctCount,
    score,
    totalScore: points.reduce((sum, point) => sum + point, 0),
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

function escapeCSV(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCSV(template: AnswerCardTemplate, records: GradedStudent[]): string {
  const header = [
    "班级",
    "学号",
    "姓名",
    ...Array.from({ length: template.questionCount }, (_, index) => `第${index + 1}题`),
    "得分",
    "总分",
  ];
  const rows = records.map((record) => [
    record.className,
    record.studentNumber,
    record.name,
    ...record.answers.map((answer) => answer ?? "未识别"),
    record.score,
    record.totalScore,
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n")}`;
}

export function downloadCSV(fileName: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
