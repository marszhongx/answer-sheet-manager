import { answerOf, AnswerSheet, Option, questionCount, questionPoints } from "./omr";
import { Classroom } from "./roster";

export type ScanRecord = {
  studentNumber: string;
  fileName: string;
  answers: Array<Option | null>;
  confidence: number[];
};

export function gradeAnswers(
  fileName: string,
  answers: Array<Option | null>,
  confidence: number[],
  studentNumber = "",
): ScanRecord {
  return { studentNumber, fileName, answers, confidence };
}

export function studentNameOf(classroom: Classroom | undefined, studentNumber: string): string {
  return (
    classroom?.students.find((student) => student.studentNumber === studentNumber)?.name ??
    "未命名学生"
  );
}

export function wrongOf(answerSheet: AnswerSheet, answers: Array<Option | null>): boolean[] {
  const standard = answerOf(answerSheet);
  return standard.map((correct, index) => answers[index] !== correct);
}

export function correctCountOf(answerSheet: AnswerSheet, answers: Array<Option | null>): number {
  return wrongOf(answerSheet, answers).filter((wrong) => !wrong).length;
}

export function scoreOf(answerSheet: AnswerSheet, answers: Array<Option | null>): number {
  const standard = answerOf(answerSheet);
  return questionPoints(answerSheet).reduce(
    (sum, point, index) => (answers[index] === standard[index] ? sum + point : sum),
    0,
  );
}

export function totalScoreOf(answerSheet: AnswerSheet): number {
  return questionPoints(answerSheet).reduce((sum, point) => sum + point, 0);
}

export function questionRates(answerSheet: AnswerSheet, records: ScanRecord[]): number[] {
  const count = questionCount(answerSheet);
  if (records.length === 0) return Array.from({ length: count }, () => 0);
  const standard = answerOf(answerSheet);
  return Array.from({ length: count }, (_, index) =>
    Math.round(
      (records.filter((record) => record.answers[index] === standard[index]).length /
        records.length) *
        100,
    ),
  );
}

export function averageScore(answerSheet: AnswerSheet, records: ScanRecord[]): number {
  return records.length
    ? records.reduce((sum, record) => sum + scoreOf(answerSheet, record.answers), 0) /
        records.length
    : 0;
}

function escapeCSV(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCSV(
  answerSheet: AnswerSheet,
  records: ScanRecord[],
  classroom?: Classroom,
): string {
  const header = [
    "班级",
    "学号",
    "姓名",
    ...Array.from({ length: questionCount(answerSheet) }, (_, index) => `第${index + 1}题`),
    "得分",
    "总分",
  ];
  const totalScore = totalScoreOf(answerSheet);
  const rows = records.map((record) => [
    classroom?.name ?? "",
    record.studentNumber,
    studentNameOf(classroom, record.studentNumber),
    ...record.answers.map((answer) => answer ?? "未识别"),
    scoreOf(answerSheet, record.answers),
    totalScore,
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
