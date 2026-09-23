import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
  vi.doUnmock("@techstark/opencv-js");
  vi.resetModules();
});

it("times out even when the exported runtime Promise never settles", async () => {
  vi.useFakeTimers();
  vi.doMock("@techstark/opencv-js", () => ({ default: new Promise(() => {}) }));
  const { getOpenCv } = await import("./opencv");
  let error: unknown;
  void getOpenCv().catch((cause) => {
    error = cause;
  });
  await vi.dynamicImportSettled();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(error).toEqual(new Error("OpenCV 初始化超时"));
});
