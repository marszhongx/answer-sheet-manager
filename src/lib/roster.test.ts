import { describe, expect, it } from "vitest";
import { normalizeStudentNumber, parseStudentCSV, sameStudentNumber } from "./roster";

describe("学号双语义比较", () => {
  it("忽略前导零后把 0088 与 88 视为同一学号", () => {
    expect(sameStudentNumber("0088", "88")).toBe(true);
    expect(sameStudentNumber("88", "0088")).toBe(true);
    expect(normalizeStudentNumber("0088")).toBe("88");
    expect(sameStudentNumber("0088", "007")).toBe(false);
  });
});

describe("学生名单导入", () => {
  it("读取带姓名和学号表头的 CSV，并保留前导零", () => {
    expect(parseStudentCSV("姓名,学号\n张同学,0088\n李同学,12")).toEqual([
      { name: "张同学", studentNumber: "0088" },
      { name: "李同学", studentNumber: "12" },
    ]);
  });

  it("读取无表头的前两列，且学号保留前导零", () => {
    expect(parseStudentCSV("王同学,03\n赵同学,4")).toEqual([
      { name: "王同学", studentNumber: "03" },
      { name: "赵同学", studentNumber: "4" },
    ]);
  });

  it("支持包含逗号、双引号和换行的标准 CSV 字段", () => {
    expect(parseStudentCSV('姓名,学号\r\n"张三,三年级",0088\r\n"李""小""明\n同学",0012')).toEqual([
      { name: "张三,三年级", studentNumber: "0088" },
      { name: '李"小"明\n同学', studentNumber: "0012" },
    ]);
  });
});
