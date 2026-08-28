import { describe, expect, it } from "vitest";
import { parseStudentCSV } from "./roster";

describe("学生名单导入", () => {
  it("读取带姓名和学号表头的 CSV，并保留前导零", () => {
    expect(parseStudentCSV("姓名,学号\n张同学,0088\n李同学,12")).toEqual([
      { name: "张同学", studentNumber: "0088" },
      { name: "李同学", studentNumber: "12" },
    ]);
  });

  it("读取无表头的前两列", () => {
    expect(parseStudentCSV("王同学,03\n赵同学,4")).toEqual([
      { name: "王同学", studentNumber: "03" },
      { name: "赵同学", studentNumber: "4" },
    ]);
  });
});
