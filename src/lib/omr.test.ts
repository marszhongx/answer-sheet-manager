import { describe, expect, it } from "vitest";
import { createLayout, hasValidMarkers, Option, recognizeWarpedCard } from "./omr";

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
    const template = {
      id: "test",
      name: "测试",
      subject: "数学",
      questionCount: 3,
      answers: ["A", "B", "C"] as Option[],
      records: [],
      createdAt: "2025-01-01T00:00:00.000Z",
    };
    expect(recognizeWarpedCard(imageWithMarkers(false), template, false).markerValid).toBe(false);
  });
});
