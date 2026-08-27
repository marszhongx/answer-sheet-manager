import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

beforeEach(() => localStorage.clear());

describe("Answer Sheet Manager H5", () => {
  it("starts with an honest empty state instead of demo answer sheets", () => {
    render(<App />);
    expect(screen.getByText("还没有答题卡")).toBeInTheDocument();
    expect(screen.getByText(/先创建一张标准答题卡/)).toBeInTheDocument();
  });

  it("opens the real standard answer sheet creation form", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "新建答题卡" }));

    expect(screen.getByRole("heading", { name: "新建答题卡" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如：第一单元测验")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建标准答题卡" })).toBeDisabled();
  });

  it("keeps scanning unavailable until a standard template exists", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "扫描" }));

    expect(screen.getByText("还没有答题卡")).toBeInTheDocument();
  });
});
