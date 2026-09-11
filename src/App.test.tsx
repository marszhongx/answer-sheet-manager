import { act, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { dbClear, dbGetAll, dbPut, StoreName } from "./lib/db";
import { useAppStore } from "./store/appStore";

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

async function resetStore() {
  await Promise.all([
    dbClear(StoreName.AnswerSheets),
    dbClear(StoreName.Classrooms),
    dbClear(StoreName.Exams),
  ]);
  await useAppStore.getState().initialize();
}

async function seedExam(scanRecords: Array<Record<string, unknown>> = []) {
  await dbPut(StoreName.AnswerSheets, {
    id: "sheet-1",
    name: "期中测验答题卡",
    subject: "数学",
    candidateNumberLength: 2,
    isTemplate: false,
    sections: [
      {
        id: "s1",
        name: "第一大题",
        pointsPerQuestion: 5,
        optionCount: 4,
        questions: [{ id: "q1", answer: "A" }],
      },
    ],
    createdAt: "2025-01-01T00:00:00.000Z",
  });
  await dbPut(StoreName.Classrooms, {
    id: "class-1",
    name: "三年级二班",
    students: [{ id: "stu-1", name: "张同学", studentNumber: "1" }],
    isTemplate: false,
  });
  await dbPut(StoreName.Exams, {
    id: "exam-1",
    name: "期中测验",
    answerSheetId: "sheet-1",
    classroomId: "class-1",
    scanRecords,
    createdAt: "2025-01-01T00:00:00.000Z",
  });
  await useAppStore.getState().initialize();
}

beforeEach(async () => {
  window.history.replaceState({}, "", "/answer-sheets");
  await resetStore();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    arc: vi.fn<(...args: never[]) => void>(),
    beginPath: vi.fn<(...args: never[]) => void>(),
    fillRect: vi.fn<(...args: never[]) => void>(),
    fillText: vi.fn<(...args: never[]) => void>(),
    drawImage: vi.fn<(...args: never[]) => void>(),
    setLineDash: vi.fn<(...args: never[]) => void>(),
    lineTo: vi.fn<(...args: never[]) => void>(),
    moveTo: vi.fn<(...args: never[]) => void>(),
    stroke: vi.fn<(...args: never[]) => void>(),
    strokeRect: vi.fn<(...args: never[]) => void>(),
  } as unknown as CanvasRenderingContext2D);
});

describe("Answer Sheet Manager H5", () => {
  it("starts with an honest empty state instead of demo answer sheets", () => {
    renderApp();
    expect(screen.getByText("还没有答题卡")).toBeInTheDocument();
    expect(screen.getByText(/先创建一张标准答题卡/)).toBeInTheDocument();
  });

  it("opens the creation route from the answer sheet list", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByText("还没有答题卡").parentElement!.querySelector("button")!);

    expect(window.location.pathname).toBe("/answer-sheets/new");
    expect(screen.getByRole("heading", { name: "新建答题卡" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建答题卡" })).toBeDisabled();
  });

  it("copies an answer sheet without retaining obsolete score data", async () => {
    const user = userEvent.setup();
    await dbPut(StoreName.AnswerSheets, {
      id: "math-1",
      name: "单元测验",
      subject: "数学",
      candidateNumberLength: 6,
      isTemplate: true,
      sections: [
        {
          id: "s1",
          name: "第一大题",
          pointsPerQuestion: 5,
          optionCount: 4,
          questions: [
            { id: "q1", answer: "A" },
            { id: "q2", answer: "B" },
            { id: "q3", answer: "C" },
          ],
        },
      ],
      records: [{ name: "张同学" }],
      createdAt: "2025-01-01T00:00:00.000Z",
    });
    await useAppStore.getState().fetchAnswerSheetList();
    renderApp();

    await user.click(screen.getByRole("button", { name: /单元测验/ }));
    await user.click(screen.getByRole("button", { name: "复制答题卡" }));

    expect(await screen.findByRole("heading", { name: "单元测验 副本" })).toBeInTheDocument();
    const answerSheets = await dbGetAll<{ name: string; records?: unknown }>(
      StoreName.AnswerSheets,
    );
    expect(answerSheets.find((sheet) => sheet.name === "单元测验 副本")?.records).toBeUndefined();
  });

  it("does not turn a missing answer sheet edit route into a creation form", async () => {
    window.history.replaceState({}, "", "/answer-sheets/missing/edit");
    renderApp();

    expect(window.location.pathname).toBe("/answer-sheets");
    expect(screen.getByText("还没有答题卡")).toBeInTheDocument();
  });

  it("does not turn a missing exam edit route into a creation form", async () => {
    window.history.replaceState({}, "", "/exams/missing/edit");
    renderApp();

    expect(window.location.pathname).toBe("/exams");
    expect(screen.queryByRole("heading", { name: "新建考试" })).not.toBeInTheDocument();
  });

  it("does not create an orphan classroom from a missing exam route", async () => {
    window.history.replaceState({}, "", "/exams/missing/classroom/edit");
    renderApp();

    expect(window.location.pathname).toBe("/exams");
    expect(screen.queryByRole("heading", { name: "新建班级" })).not.toBeInTheDocument();
  });

  it("review only offers options configured for each question", async () => {
    await seedExam();
    useAppStore.setState({
      review: {
        examId: "exam-1",
        fileName: "paper.jpg",
        recognition: {
          answers: [null],
          confidence: [0],
          fillRates: [[0, 0, 0, 0]],
          markerValid: true,
          studentNumber: "01",
        },
      },
    });
    window.history.replaceState({}, "", "/exams/exam-1/review");
    renderApp();

    expect(screen.getByRole("button", { name: "D" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "E" })).not.toBeInTheDocument();
  });

  it("renders results when records change from empty to non-empty", async () => {
    await seedExam();
    window.history.replaceState({}, "", "/exams/exam-1/results");
    renderApp();
    expect(screen.getByText("暂无阅卷记录")).toBeInTheDocument();

    const exam = useAppStore.getState().examMap["exam-1"]!;
    await act(async () => {
      useAppStore.setState({
        examList: [
          {
            ...exam,
            scanRecords: [
              { studentNumber: "1", fileName: "paper.jpg", answers: ["A"], confidence: [1] },
            ],
          },
        ],
        examMap: {
          ...useAppStore.getState().examMap,
          "exam-1": {
            ...exam,
            scanRecords: [
              { studentNumber: "1", fileName: "paper.jpg", answers: ["A"], confidence: [1] },
            ],
          },
        },
      });
    });

    expect(screen.getByText("班级平均分")).toBeInTheDocument();
  });

  it("redirects safely when the displayed results exam is removed", async () => {
    await seedExam([
      { studentNumber: "1", fileName: "paper.jpg", answers: ["A"], confidence: [1] },
    ]);
    window.history.replaceState({}, "", "/exams/exam-1/results");
    renderApp();
    expect(screen.getByText("班级平均分")).toBeInTheDocument();

    await act(async () => {
      useAppStore.setState({ examList: [], examMap: {} });
    });

    expect(window.location.pathname).toBe("/exams");
  });

  it("opens the answer sheet preview from the exam detail page", async () => {
    const user = userEvent.setup();
    await seedExam();
    window.history.replaceState({}, "", "/exams/exam-1");
    renderApp();

    await user.click(screen.getByRole("button", { name: "下载答题卡" }));

    expect(window.location.pathname).toBe("/exams/exam-1/answer-sheet/preview");
    expect(screen.getByRole("heading", { name: "预览答题卡" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载答题卡" })).toBeInTheDocument();
  });
});
