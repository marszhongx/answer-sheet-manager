import cvReady from "@techstark/opencv-js";
import { afterEach, expect, it, vi } from "vitest";
import { getOpenCv } from "./opencv";

// Vitest's CommonJS interop treats a Promise export as a thenable namespace.
// Preserve the package's real export while avoiding that test-runner wrapper.
vi.mock("@techstark/opencv-js", async () => {
  const { createRequire } = await import("node:module");
  return { default: createRequire(import.meta.url)("@techstark/opencv-js") };
});

afterEach(() => vi.restoreAllMocks());

it("loads the installed Promise-exporting OpenCV runtime without timing out", async () => {
  const cv = await cvReady;
  const originalSetTimeout = window.setTimeout.bind(window);
  // Keep a broken loader test fast instead of waiting the production 60 seconds.
  vi.spyOn(window, "setTimeout").mockImplementation(((handler: TimerHandler) =>
    originalSetTimeout(handler, 50)) as typeof window.setTimeout);

  await expect(getOpenCv()).resolves.toBe(cv);
  await expect(getOpenCv()).resolves.toBe(cv);
});
