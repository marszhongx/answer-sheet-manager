import { describe, expect, it } from "vitest";
import {
  averageScore,
  correctCountOf,
  gradeAnswers,
  questionRates,
  scoreOf,
  toCSV,
  wrongOf,
} from "./grading";
import { AnswerSheet } from "./omr";
import { Classroom } from "./roster";

const answerSheet: AnswerSheet = {
  id: "test",
  name: "测试答题卡",
  subject: "数学",
  candidateNumberLength: 6,
  sections: [
    {
      id: "first",
      name: "第一大题",
      pointsPerQuestion: 3,
      optionCount: 4,
      questions: [
        { id: "q1", answer: "A" },
        { id: "q2", answer: "B" },
      ],
    },
    {
      id: "second",
      name: "第二大题",
      pointsPerQuestion: 6,
      optionCount: 4,
      questions: [{ id: "q3", answer: "C" }],
    },
  ],
  createdAt: "2025-01-01T00:00:00.000Z",
  isTemplate: true,
};

const classroom: Classroom = {
  id: "class-1",
  name: "一班",
  students: [{ id: "stu-1", name: "张同学", studentNumber: "88" }],
  isTemplate: true,
};

describe("真实答案批改", () => {
  it("按识别到的真实选项逐题判分", () => {
    const record = gradeAnswers("paper.jpg", ["A", "D", "C"], [1, 0.9, 1], "88");
    expect(correctCountOf(answerSheet, record.answers)).toBe(2);
    expect(scoreOf(answerSheet, record.answers)).toBe(9);
    expect(wrongOf(answerSheet, record.answers)).toEqual([false, true, false]);
  });

  it("未识别的题目不会得分", () => {
    const record = gradeAnswers("paper.jpg", ["A", null, null], [1, 0, 0], "88");
    expect(scoreOf(answerSheet, record.answers)).toBe(3);
    expect(wrongOf(answerSheet, record.answers)).toEqual([false, true, true]);
  });

  it("从真实批改记录计算正确率与平均分", () => {
    const first = gradeAnswers("1.jpg", ["A", "B", "C"], [1, 1, 1], "88");
    const second = gradeAnswers("2.jpg", ["A", "A", "C"], [1, 1, 1], "66");
    expect(questionRates(answerSheet, [first, second])).toEqual([100, 50, 100]);
    expect(averageScore(answerSheet, [first, second])).toBe(10.5);
  });

  it("CSV 包含人工确认后的答案和成绩（学生名从班级名单实时取）", () => {
    const record = gradeAnswers("paper.jpg", ["A", null, "C"], [1, 0, 1], "88");
    const csv = toCSV(answerSheet, [record], classroom);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("班级,学号,姓名,第1题,第2题,第3题,得分,总分");
    expect(csv).toContain("一班,88,张同学,A,未识别,C,9,12");
  });

  it("CSV 转义含逗号、引号与换行的字段", () => {
    const record = gradeAnswers("paper.jpg", ["A", "B", "C"], [1, 1, 1], "88");
    const special = {
      ...classroom,
      name: "一班\n二班",
      students: [{ id: "stu-1", name: '李"四",同学', studentNumber: "88" }],
    };
    const csv = toCSV(answerSheet, [record], special);
    expect(csv).toContain('"一班\n二班",88,"李""四"",同学",A,B,C,12,12');
    expect(csv.split("\n").length).toBe(3);
  });
});
