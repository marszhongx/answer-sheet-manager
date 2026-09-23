import { describe, expect, it } from "vitest";
import { chooseCorners } from "./scannerGeometry";
import { createLayout } from "./omr";

describe("扫描定位角点", () => {
  it("使用当前布局比例接受宽版答题卡", () => {
    const layout = createLayout(100, 2);
    const points = layout.markers.map((marker) => ({
      x: marker.x + marker.size / 2,
      y: marker.y + marker.size / 2,
    }));
    expect(chooseCorners(points, 1472 / 633)).toEqual(points);
  });

  it("拒绝与当前布局明显不符的狭长四边形", () => {
    expect(
      chooseCorners(
        [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
          { x: 1000, y: 100 },
          { x: 0, y: 100 },
        ],
        1,
      ),
    ).toBeNull();
  });

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
