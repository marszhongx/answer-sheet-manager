import { describe, expect, it } from "vitest";
import { chooseCorners } from "./scannerGeometry";

describe("扫描定位角点", () => {
  it("存在额外方形噪声时仍选择答题卡的左下角", () => {
    const corners = chooseCorners([
      { x: 100, y: 100 },
      { x: 600, y: 100 },
      { x: 600, y: 500 },
      { x: 100, y: 500 },
      { x: 550, y: 250 },
    ]);

    expect(corners).toEqual([
      { x: 100, y: 100 },
      { x: 600, y: 100 },
      { x: 600, y: 500 },
      { x: 100, y: 500 },
    ]);
  });
});
