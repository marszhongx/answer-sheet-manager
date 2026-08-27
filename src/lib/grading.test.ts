import { describe, expect, it } from "vitest";
import { averageScore, gradeAnswers, questionRates, toCSV } from "./grading";
import { AnswerCardTemplate } from "./omr";

const template: AnswerCardTemplate = {
  id: "test",
  name: "测试答题卡",
  subject: "数学",
  questionCount: 3,
  answers: ["A", "B", "C"],
  records: [],
  createdAt: "2025-01-01T00:00:00.000Z",
};

describe("真实答案批改", () => {
  it("按识别到的真实选项逐题判分", () => {
    const record = gradeAnswers(template, "张同学", "paper.jpg", ["A", "D", "C"], [1, 0.9, 1]);
    expect(record.correctCount).toBe(2);
    expect(record.score).toBe(10);
    expect(record.wrong).toEqual([false, true, false]);
  });

  it("未识别的题目不会得分", () => {
    const record = gradeAnswers(template, "张同学", "paper.jpg", ["A", null, null], [1, 0, 0]);
    expect(record.score).toBe(5);
    expect(record.wrong).toEqual([false, true, true]);
  });

  it("从真实批改记录计算正确率与平均分", () => {
    const first = gradeAnswers(template, "甲", "1.jpg", ["A", "B", "C"], [1, 1, 1]);
    const second = gradeAnswers(template, "乙", "2.jpg", ["A", "A", "C"], [1, 1, 1]);
    expect(questionRates([first, second], 3)).toEqual([100, 50, 100]);
    expect(averageScore([first, second])).toBe(12.5);
  });

  it("CSV 包含人工确认后的答案和成绩", () => {
    const record = gradeAnswers(template, "张同学", "paper.jpg", ["A", null, "C"], [1, 0, 1]);
    const csv = toCSV(template, [record]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("姓名,第1题,第2题,第3题,得分,总分");
    expect(csv).toContain("张同学,A,未识别,C,10,15");
  });
});
