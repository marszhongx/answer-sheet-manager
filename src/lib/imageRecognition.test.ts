import { Canvas, createCanvas, ImageData } from "@napi-rs/canvas";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recognizeImageWithOpenCv } from "./imageRecognition";
import { AnswerSheet, createLayout, drawAnswerSheet, fitsA4 } from "./omr";

// Use the real WASM runtime, bypassing Vitest's thenable CommonJS namespace wrapper.
vi.mock("@techstark/opencv-js", async () => {
  const { createRequire } = await import("node:module");
  return { default: createRequire(import.meta.url)("@techstark/opencv-js") };
});

beforeEach(() => {
  vi.stubGlobal("HTMLCanvasElement", Canvas);
  vi.stubGlobal("ImageData", ImageData);
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tagName, options) =>
    tagName === "canvas"
      ? (createCanvas(1, 1) as unknown as HTMLCanvasElement)
      : createElement(tagName, options),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function sheetWith(count: number): AnswerSheet {
  return {
    id: "sheet",
    name: "测试答题卡",
    subject: "数学",
    candidateNumberLength: 2,
    isTemplate: true,
    createdAt: "2025-01-01",
    sections: [
      {
        id: "s1",
        name: "第一大题",
        pointsPerQuestion: 5,
        optionCount: 4,
        questions: Array.from({ length: count }, (_, index) => ({ id: `q${index}`, answer: "B" })),
      },
    ],
  };
}

function filledCard(sheet: AnswerSheet, printed = true): HTMLCanvasElement {
  const layout = createLayout(sheet.sections[0]!.questions.length, 2);
  const canvas = createCanvas(layout.width, layout.height);
  const context = canvas.getContext("2d");
  if (printed) {
    drawAnswerSheet(canvas as unknown as HTMLCanvasElement, sheet);
  } else {
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    layout.markers.forEach((marker) =>
      context.fillRect(marker.x, marker.y, marker.size, marker.size),
    );
  }
  context.fillStyle = "black";
  for (const bubble of layout.bubbles.filter((item) => item.option === "B")) {
    context.beginPath();
    context.arc(bubble.x, bubble.y, 12, 0, Math.PI * 2);
    context.fill();
  }
  for (const bubble of layout.studentNumberBubbles.filter(
    (item) => item.value === item.digitIndex,
  )) {
    context.beginPath();
    context.arc(bubble.x, bubble.y, 13, 0, Math.PI * 2);
    context.fill();
  }
  return canvas as unknown as HTMLCanvasElement;
}

describe("printed card recognition with real Canvas and OpenCV", () => {
  it("locates the printed markers despite the card's border and reads the filled answers", async () => {
    const sheet = sheetWith(20);
    const result = await recognizeImageWithOpenCv(filledCard(sheet), sheet);
    expect(result.markerValid).toBe(true);
    expect(result.studentNumber).toBe("01");
    expect(result.answers).toEqual(Array(20).fill("B"));
  });

  it("can scan a second layout of a different size in the same session", async () => {
    for (const count of [1, 21]) {
      const sheet = sheetWith(count);
      // Isolate the size-switching regression from printed-border detection.
      const result = await recognizeImageWithOpenCv(filledCard(sheet, false), sheet);
      expect(result.studentNumber).toBe("01");
      expect(result.answers).toEqual(Array(count).fill("B"));
    }
  });

  it("recognizes a printable wide 100-question card", async () => {
    const sheet = sheetWith(100);
    expect(fitsA4(sheet)).toBe(true);
    const result = await recognizeImageWithOpenCv(filledCard(sheet), sheet);
    expect(result.studentNumber).toBe("01");
    expect(result.answers).toEqual(Array(100).fill("B"));
  });

  it("recognizes a wide card in a 720px image as well as in a camera frame", async () => {
    const sheet = sheetWith(100);
    const canvas = createCanvas(720, 339);
    canvas.getContext("2d").drawImage(filledCard(sheet) as unknown as Canvas, 0, 0, 720, 339);
    const result = await recognizeImageWithOpenCv(canvas as unknown as HTMLCanvasElement, sheet);
    expect(result.studentNumber).toBe("01");
    expect(result.answers).toEqual(Array(100).fill("B"));
  });

  it("rejects an image with no markers", async () => {
    const canvas = createCanvas(600, 800);
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, 600, 800);
    await expect(
      recognizeImageWithOpenCv(canvas as unknown as HTMLCanvasElement, sheetWith(20)),
    ).rejects.toThrow("未找到答题卡四个定位方块");
  });
});
