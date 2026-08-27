import { useEffect, useRef, useState } from "react";
import { Camera, Check, LoaderCircle, RotateCcw, ScanLine, X } from "lucide-react";
import { AnswerCardTemplate, createLayout, Recognition, recognizeWarpedCard } from "../lib/omr";
import { getOpenCv } from "../lib/opencv";

type Props = {
  template: AnswerCardTemplate;
  onConfirm: (recognition: Recognition) => void;
  onClose: () => void;
};

type ScannerState = "loading" | "searching" | "ready" | "error";

type Point = { x: number; y: number };

function isClose(a: Point, b: Point): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < 12;
}

function chooseCorners(points: Point[]): Point[] | null {
  if (points.length < 4) return null;
  const unique = (point: Point, used: Point[]) => !used.some((item) => isClose(point, item));
  const select = (sort: (a: Point, b: Point) => number, used: Point[]) =>
    points.toSorted(sort).find((point) => unique(point, used));
  const selected: Point[] = [];
  const topLeft = select((a, b) => a.x + a.y - b.x - b.y, selected);
  if (!topLeft) return null;
  selected.push(topLeft);
  const topRight = select((a, b) => b.x - b.y - a.x + a.y, selected);
  if (!topRight) return null;
  selected.push(topRight);
  const bottomRight = select((a, b) => b.x + b.y - a.x - a.y, selected);
  if (!bottomRight) return null;
  selected.push(bottomRight);
  const bottomLeft = select((a, b) => a.y - a.x - b.y + b.x, selected);
  if (!bottomLeft) return null;
  const corners = [topLeft, topRight, bottomRight, bottomLeft];
  const lengths = corners.map((point, index) => {
    const next = corners[(index + 1) % corners.length];
    return Math.hypot(next.x - point.x, next.y - point.y);
  });
  const area = Math.abs(
    corners.reduce((sum, point, index) => {
      const next = corners[(index + 1) % corners.length];
      return sum + point.x * next.y - point.y * next.x;
    }, 0) / 2,
  );
  return area >= 20_000 &&
    Math.min(...lengths) >= 80 &&
    Math.max(...lengths) / Math.min(...lengths) <= 2.2
    ? corners
    : null;
}

function project(point: Point, matrix: number[]): Point {
  const denominator = matrix[6] * point.x + matrix[7] * point.y + matrix[8];
  return {
    x: (matrix[0] * point.x + matrix[1] * point.y + matrix[2]) / denominator,
    y: (matrix[3] * point.x + matrix[4] * point.y + matrix[5]) / denominator,
  };
}

export default function LiveScanner({ template, onConfirm, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const lastRun = useRef(0);
  const processingRef = useRef(false);
  const [state, setState] = useState<ScannerState>("loading");
  const [message, setMessage] = useState("正在启动相机");
  const [recognition, setRecognition] = useState<Recognition | null>(null);

  useEffect(() => {
    let disposed = false;
    async function start() {
      try {
        await getOpenCv();
        if (disposed) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setState("searching");
        setMessage("请将答题卡四个定位方块完整放入画面");
      } catch (error) {
        setState("error");
        setMessage(
          error instanceof Error ? `无法打开相机：${error.message}` : "无法打开相机，请检查权限",
        );
      }
    }
    start();
    return () => {
      disposed = true;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (state !== "searching" && state !== "ready") return;
    const tick = (time: number) => {
      requestRef.current = requestAnimationFrame(tick);
      if (processingRef.current || time - lastRun.current < 180) return;
      lastRun.current = time;
      const video = videoRef.current;
      const frame = frameRef.current;
      const overlay = overlayRef.current;
      if (!video || !frame || !overlay || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)
        return;
      const width = 720;
      const height = Math.round(width / (video.videoWidth / video.videoHeight));
      if (!height) return;
      frame.width = overlay.width = width;
      frame.height = overlay.height = height;
      const frameCtx = frame.getContext("2d", { willReadFrequently: true });
      const overlayCtx = overlay.getContext("2d");
      if (!frameCtx || !overlayCtx) return;
      frameCtx.drawImage(video, 0, 0, width, height);
      overlayCtx.clearRect(0, 0, width, height);
      processingRef.current = true;
      void processFrame(frame, overlayCtx, template, setState, setMessage, setRecognition).finally(
        () => {
          processingRef.current = false;
        },
      );
    };
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [state, template]);

  return (
    <div className="scanner-screen">
      <video ref={videoRef} className="scanner-video" playsInline muted />
      <canvas ref={overlayRef} className="scanner-overlay" />
      <canvas ref={frameRef} hidden />
      <header className="scanner-header">
        <button aria-label="关闭相机" onClick={onClose}>
          <X size={22} />
        </button>
        <div>
          <b>实时扫描</b>
          <span>{state === "ready" ? "答题卡已定位" : "定位答题卡"}</span>
        </div>
        <button
          aria-label="切换为重新定位"
          onClick={() => {
            setRecognition(null);
            setState("searching");
          }}
        >
          <RotateCcw size={20} />
        </button>
      </header>
      <div className={`scanner-status ${state}`}>
        {state === "loading" ? (
          <LoaderCircle className="spin" size={17} />
        ) : state === "ready" ? (
          <Check size={17} />
        ) : (
          <ScanLine size={17} />
        )}
        <span>{message}</span>
      </div>
      {recognition && (
        <div className="scanner-score">
          <b>
            {recognition.answers.filter((answer, index) => answer === template.answers[index])
              .length * 5}
          </b>
          <span>/ {template.questionCount * 5} 分</span>
        </div>
      )}
      <footer className="scanner-footer">
        <button
          className="scanner-capture"
          disabled={!recognition || !recognition.markerValid}
          onClick={() => recognition && onConfirm(recognition)}
        >
          <Camera size={21} />
          {recognition?.markerValid ? "确认本次阅卷" : "正在寻找答题卡"}
        </button>
      </footer>
    </div>
  );
}

async function processFrame(
  frame: HTMLCanvasElement,
  overlay: CanvasRenderingContext2D,
  template: AnswerCardTemplate,
  setState: (state: ScannerState) => void,
  setMessage: (message: string) => void,
  setRecognition: (recognition: Recognition | null) => void,
) {
  let src: any;
  let gray: any;
  let binary: any;
  let contours: any;
  let hierarchy: any;
  let sourcePoints: any;
  let targetPoints: any;
  let transform: any;
  let inverse: any;
  let full: any;
  let warped: any;
  try {
    const cv = await getOpenCv();
    src = cv.imread(frame);
    gray = new cv.Mat();
    binary = new cv.Mat();
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, 92, 255, cv.THRESH_BINARY_INV);
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    const candidates: Point[] = [];
    for (let index = 0; index < contours.size(); index++) {
      const contour = contours.get(index);
      const rect = cv.boundingRect(contour);
      contour.delete();
      const ratio = rect.width / rect.height;
      if (
        rect.width < 11 ||
        rect.height < 11 ||
        rect.width > 90 ||
        rect.height > 90 ||
        ratio < 0.72 ||
        ratio > 1.28
      )
        continue;
      if (rect.width * rect.height < 170) continue;
      candidates.push({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
    }
    const corners = chooseCorners(candidates);
    if (!corners) {
      setState("searching");
      setRecognition(null);
      setMessage("请让四个黑色定位方块完整进入画面");
      return;
    }
    const layout = createLayout(template.questionCount);
    const destination = layout.markers.map((marker) => ({
      x: marker.x + marker.size / 2,
      y: marker.y + marker.size / 2,
    }));
    sourcePoints = cv.matFromArray(
      4,
      1,
      cv.CV_32FC2,
      corners.flatMap((point) => [point.x, point.y]),
    );
    targetPoints = cv.matFromArray(
      4,
      1,
      cv.CV_32FC2,
      destination.flatMap((point) => [point.x, point.y]),
    );
    transform = cv.getPerspectiveTransform(sourcePoints, targetPoints);
    inverse = new cv.Mat();
    cv.invert(transform, inverse);
    full = cv.imread(frame);
    warped = new cv.Mat();
    cv.warpPerspective(
      full,
      warped,
      transform,
      new cv.Size(layout.width, layout.height),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(255, 255, 255, 255),
    );
    const warpedCanvas = document.createElement("canvas");
    warpedCanvas.width = layout.width;
    warpedCanvas.height = layout.height;
    cv.imshow(warpedCanvas, warped);
    const warpedContext = warpedCanvas.getContext("2d", { willReadFrequently: true });
    if (!warpedContext) throw new Error("无法读取相机帧");
    const recognition = recognizeWarpedCard(
      warpedContext.getImageData(0, 0, layout.width, layout.height),
      template,
    );
    const inverseMatrix = Array.from(inverse.data64F as Float64Array);
    drawOverlay(overlay, corners, layout, inverseMatrix, recognition, template);
    setRecognition(recognition);
    setState("ready");
    setMessage(
      recognition.answers.some((answer) => answer === null)
        ? "检测到未填或多填项，请检查标记"
        : "识别稳定，可确认阅卷",
    );
  } catch {
    setState("searching");
    setRecognition(null);
    setMessage("正在调整识别，请保持答题卡平整并避免反光");
  } finally {
    [
      src,
      gray,
      binary,
      contours,
      hierarchy,
      sourcePoints,
      targetPoints,
      transform,
      inverse,
      full,
      warped,
    ].forEach((value) => value?.delete());
  }
}

function drawOverlay(
  overlay: CanvasRenderingContext2D,
  corners: Point[],
  layout: ReturnType<typeof createLayout>,
  inverse: number[],
  recognition: Recognition,
  template: AnswerCardTemplate,
) {
  overlay.lineWidth = 3;
  overlay.strokeStyle = "#36dfbd";
  overlay.beginPath();
  overlay.moveTo(corners[0].x, corners[0].y);
  corners.slice(1).forEach((point) => overlay.lineTo(point.x, point.y));
  overlay.closePath();
  overlay.stroke();
  layout.bubbles.forEach((bubble) => {
    const answer = recognition.answers[bubble.question];
    if (answer !== bubble.option) return;
    const point = project({ x: bubble.x, y: bubble.y }, inverse);
    const correct = answer === template.answers[bubble.question];
    overlay.fillStyle = correct ? "rgba(46, 228, 187, .72)" : "rgba(255, 84, 101, .76)";
    overlay.beginPath();
    overlay.arc(point.x, point.y, 9, 0, Math.PI * 2);
    overlay.fill();
  });
  layout.bubbles
    .filter((bubble) => recognition.answers[bubble.question] === null)
    .filter((bubble) => bubble.option === "A")
    .forEach((bubble) => {
      const point = project({ x: bubble.x, y: bubble.y }, inverse);
      overlay.fillStyle = "rgba(255, 177, 66, .95)";
      overlay.font = "bold 13px sans-serif";
      overlay.fillText("?", point.x - 18, point.y + 5);
    });
}
