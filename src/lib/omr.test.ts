import { describe, expect, it } from "vitest";
import { createLayout, fitsA4, hasValidMarkers, Option, recognizeWarpedCard } from "./omr";

function answerSheetWith(questionCount: number, optionCount = 4, candidateNumberLength = 6) {
  return {
    id: "test",
    name: "测试",
    subject: "数学",
    questionCount,
    answers: Array.from({ length: questionCount }, (_, index) =>
      "ABCDEFGHIJ"[index % optionCount],
    ) as Option[],
    sections: [{ id: "s", name: "第一大题", questionCount, pointsPerQuestion: 5, optionCount }],
    candidateNumberLength,
    createdAt: "2025-01-01T00:00:00.000Z",
    isTemplate: true,
  };
}

function imageWithMarkers(includeLast = true): ImageData {
  const layout = createLayout(3);
  const data = new Uint8ClampedArray(layout.width * layout.height * 4);
  data.fill(255);
  const image = { width: layout.width, height: layout.height, data } as ImageData;
  layout.markers.forEach((marker, index) => {
    if (!includeLast && index === layout.markers.length - 1) return;
    for (let y = marker.y; y < marker.y + marker.size; y++) {
      for (let x = marker.x; x < marker.x + marker.size; x++) {
        const offset = (y * image.width + x) * 4;
        image.data[offset] = 0;
        image.data[offset + 1] = 0;
        image.data[offset + 2] = 0;
        image.data[offset + 3] = 255;
      }
    }
  });
  return image;
}

describe("OMR marker validation", () => {
  it("accepts four dark corner markers", () => {
    const layout = createLayout(3);
    expect(hasValidMarkers(imageWithMarkers(), layout)).toBe(true);
  });

  it("rejects an image with a missing marker", () => {
    const layout = createLayout(3);
    expect(hasValidMarkers(imageWithMarkers(false), layout)).toBe(false);
  });

  it("preserves explicit marker validation in recognition", () => {
    const answerSheet = {
      id: "test",
      name: "测试",
      subject: "数学",
      questionCount: 3,
      answers: ["A", "B", "C"] as Option[],
      candidateNumberLength: 6,
      createdAt: "2025-01-01T00:00:00.000Z",
      isTemplate: true,
    };
    expect(recognizeWarpedCard(imageWithMarkers(false), answerSheet, false).markerValid).toBe(false);
  });
});

describe("A4 可打印性校验", () => {
  it("常见配置可放入 A4", () => {
    expect(fitsA4(answerSheetWith(20))).toBe(true);
    expect(fitsA4(answerSheetWith(50))).toBe(true);
  });

  it("题目过多时拒绝创建", () => {
    expect(fitsA4(answerSheetWith(100))).toBe(false);
    expect(fitsA4(answerSheetWith(60, 10))).toBe(false);
  });
});
