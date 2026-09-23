import { Canvas, createCanvas, ImageData } from "@napi-rs/canvas";
import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AnswerSheet, createLayout, drawAnswerSheet, Recognition } from "../lib/omr";
import LiveScanner from "./LiveScanner";

vi.mock("@techstark/opencv-js", async () => {
  const { createRequire } = await import("node:module");
  return { default: createRequire(import.meta.url)("@techstark/opencv-js") };
});

const mediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (mediaDevicesDescriptor)
    Object.defineProperty(navigator, "mediaDevices", mediaDevicesDescriptor);
  else Reflect.deleteProperty(navigator, "mediaDevices");
});

it("recognizes camera frames after switching to a different, wide card layout", async () => {
  let frameImage = createCanvas(1, 1);
  let nextFrame: FrameRequestCallback | undefined;
  vi.stubGlobal("ImageData", ImageData);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    nextFrame = callback;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    nextFrame = undefined;
  });
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(2);
  vi.spyOn(HTMLVideoElement.prototype, "videoWidth", "get").mockImplementation(
    () => frameImage.width,
  );
  vi.spyOn(HTMLVideoElement.prototype, "videoHeight", "get").mockImplementation(
    () => frameImage.height,
  );

  // Back jsdom canvases with real pixels. Only the camera input is substituted.
  const canvases = new WeakMap<HTMLCanvasElement, Canvas>();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function (this: HTMLCanvasElement) {
      let canvas = canvases.get(this);
      if (!canvas) {
        canvas = createCanvas(this.width, this.height);
        const context = canvas.getContext("2d");
        const drawImage = context.drawImage.bind(context);
        context.drawImage = () => drawImage(frameImage, 0, 0, canvas!.width, canvas!.height);
        canvases.set(this, canvas);
      }
      if (canvas.width !== this.width) canvas.width = this.width;
      if (canvas.height !== this.height) canvas.height = this.height;
      return canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
    },
  );

  function cameraCard(count: number): AnswerSheet {
    const sheet: AnswerSheet = {
      id: `sheet-${count}`,
      name: "答题卡",
      subject: "数学",
      candidateNumberLength: 2,
      isTemplate: true,
      createdAt: "2025-01-01",
      sections: [
        {
          id: "s1",
          name: "第一大题",
          optionCount: 4,
          pointsPerQuestion: 5,
          questions: Array.from({ length: count }, (_, index) => ({
            id: `q${index}`,
            answer: "B",
          })),
        },
      ],
    };
    const layout = createLayout(count, 2);
    frameImage = createCanvas(layout.width, layout.height);
    drawAnswerSheet(frameImage as unknown as HTMLCanvasElement, sheet);
    const context = frameImage.getContext("2d");
    context.fillStyle = "black";
    for (const bubble of [
      ...layout.bubbles.filter((item) => item.option === "B"),
      ...layout.studentNumberBubbles.filter((item) => item.value === item.digitIndex),
    ]) {
      context.beginPath();
      context.arc(bubble.x, bubble.y, 13, 0, Math.PI * 2);
      context.fill();
    }
    return sheet;
  }

  let confirmed: Recognition | undefined;
  const onConfirm = (recognition: Recognition) => {
    confirmed = recognition;
  };
  const first = cameraCard(1);
  const view = render(<LiveScanner answerSheet={first} onConfirm={onConfirm} onClose={() => {}} />);
  await screen.findByText("请将答题卡四个定位方块完整放入画面");
  await act(async () => {
    nextFrame?.(1000);
  });
  expect(screen.getByRole("button", { name: "确认本次阅卷" })).toBeEnabled();

  const wide = cameraCard(100);
  view.rerender(<LiveScanner answerSheet={wide} onConfirm={onConfirm} onClose={() => {}} />);
  await act(async () => {
    nextFrame?.(2000);
  });
  await act(async () => {
    screen.getByRole("button", { name: "确认本次阅卷" }).click();
  });
  expect(confirmed?.studentNumber).toBe("01");
  expect(confirmed?.answers).toEqual(Array(100).fill("B"));
});
