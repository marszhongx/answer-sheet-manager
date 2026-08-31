import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { useAppStore } from "./store/appStore";

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

function resetStore() {
  useAppStore.getState().fetchAnswerSheetList();
  useAppStore.getState().fetchClassroomList();
  useAppStore.getState().fetchExamList();
}

beforeEach(() => {
  window.history.replaceState({}, "", "/answer-sheets");
  localStorage.clear();
  resetStore();
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
    localStorage.setItem(
      "answer-sheet-manager.answerSheets",
      JSON.stringify([
        {
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
        },
      ]),
    );
    resetStore();
    renderApp();

    await user.click(screen.getByRole("button", { name: /单元测验/ }));
    await user.click(screen.getByRole("button", { name: "复制答题卡" }));

    expect(screen.getByRole("heading", { name: "单元测验 副本" })).toBeInTheDocument();
    const answerSheets = JSON.parse(localStorage.getItem("answer-sheet-manager.answerSheets") ?? "[]");
    expect(answerSheets[0].records).toBeUndefined();
  });
});
