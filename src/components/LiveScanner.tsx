import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, LoaderCircle, RotateCcw, ScanLine, X } from "lucide-react";
import {
  answerOf,
  AnswerSheet,
  CardLayout,
  createLayout,
  Option,
  questionCount,
  questionOptions,
  questionPoints,
  Recognition,
  recognizeCard,
} from "../lib/omr";
import { getOpenCv } from "../lib/opencv";
import { chooseCorners, Point } from "../lib/scannerGeometry";
import styles from "./LiveScanner.module.css";

// 答题卡定位到之后结果通常已经稳定，没必要再按搜索期的频率跑满帧
const SEARCH_INTERVAL = 180;
const STABLE_INTERVAL = 420;

type Props = {
  answerSheet: AnswerSheet;
  onConfirm: (recognition: Recognition) => void;
  onClose: () => void;
};

type ScannerState = "loading" | "searching" | "ready" | "error";

// 答题卡位置与识别结果都没变时才算稳定；只比对答案会让“移动中的卡”也降频，浮层就会滞后
type FrameResult = { recognition: Recognition; signature: string } | null;

function frameSignature(corners: Point[], recognition: Recognition): string {
  const centerX = corners.reduce((sum, point) => sum + point.x, 0) / corners.length / 5;
  const centerY = corners.reduce((sum, point) => sum + point.y, 0) / corners.length / 5;
  return `${Math.round(centerX)},${Math.round(centerY)}|${recognition.answers.join("")}`;
}
// 每帧都要用到、但只随答题卡变化的数据，预先算好避免逐帧重复分配
type FrameContext = {
  layout: CardLayout;
  options: Option[][];
  standard: Option[];
  candidateNumberLength: number;
  warped: HTMLCanvasElement;
};

function project(point: Point, matrix: number[]): Point {
  // OpenCV 的透视矩阵固定为 3x3，解构出默认值避免逐项下标访问
  const [m0 = 0, m1 = 0, m2 = 0, m3 = 0, m4 = 0, m5 = 0, m6 = 0, m7 = 0, m8 = 1] = matrix;
  const denominator = m6 * point.x + m7 * point.y + m8;
  return {
    x: (m0 * point.x + m1 * point.y + m2) / denominator,
    y: (m3 * point.x + m4 * point.y + m5) / denominator,
  };
}

// OpenCV 的 Size/Scalar 是堆对象，逐帧 new 会泄漏；布局尺寸固定时复用同一实例（F13）。
let warpSizeCache: { width: number; height: number; instance: any } | null = null;
let whiteScalar: any = null;

function warpSize(cv: any, width: number, height: number): any {
  if (warpSizeCache?.width === width && warpSizeCache?.height === height) {
    return warpSizeCache.instance;
  }
  warpSizeCache?.instance?.delete();
  const instance = new cv.Size(width, height);
  warpSizeCache = { width, height, instance };
  return instance;
}

function whiteScalarInstance(cv: any): any {
  if (!whiteScalar) whiteScalar = new cv.Scalar(255, 255, 255, 255);
  return whiteScalar;
}

export default function LiveScanner({ answerSheet, onConfirm, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const lastRun = useRef(0);
  const processingRef = useRef(false);
  const stableRef = useRef(false);
  const lastSignature = useRef("");
  const warpedRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<ScannerState>("loading");
  const [message, setMessage] = useState("正在启动相机");
  const [recognition, setRecognition] = useState<Recognition | null>(null);
  const points = questionPoints(answerSheet);
  const totalScore = points.reduce((sum, point) => sum + point, 0);
  // 布局、选项表、标准答案只由答题卡决定，逐帧重算会随题目数呈 O(n²) 增长
  const options = useMemo(() => questionOptions(answerSheet), [answerSheet]);
  const layout = useMemo(
    () =>
      createLayout(
        questionCount(answerSheet),
        answerSheet.candidateNumberLength,
        options.map((item) => item.length),
      ),
    [answerSheet, options],
  );
  const standard = useMemo(() => answerOf(answerSheet), [answerSheet]);

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
      if (
        processingRef.current ||
        time - lastRun.current < (stableRef.current ? STABLE_INTERVAL : SEARCH_INTERVAL)
      )
        return;
      lastRun.current = time;
      const video = videoRef.current;
      const frame = frameRef.current;
      const overlay = overlayRef.current;
      if (!video || !frame || !overlay || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)
        return;
      // 帧处理固定降到 720 宽：在识别精度与性能间取折中，也降低主线程逐帧处理的开销（F21）。
      // 轮廓搜索范围仍覆盖整帧；若需彻底消除主线程阻塞，后续应把灰度/阈值/轮廓/透视/识别
      // 整体迁到 Web Worker，本任务暂不 Worker 化（工程量大、风险高）。
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
      if (!warpedRef.current) warpedRef.current = document.createElement("canvas");
      const context: FrameContext = {
        layout,
        options,
        standard,
        candidateNumberLength: answerSheet.candidateNumberLength,
        warped: warpedRef.current,
      };
      processingRef.current = true;
      void processFrame(frame, overlayCtx, context, setState, setMessage, setRecognition)
        .then((result) => {
          stableRef.current = result !== null && result.signature === lastSignature.current;
          lastSignature.current = result?.signature ?? "";
        })
        .finally(() => {
          processingRef.current = false;
        });
    };
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [state, answerSheet.candidateNumberLength, layout, options, standard]);

  return (
    <div className={styles.screen}>
      <video ref={videoRef} className={styles.video} playsInline muted />
      <canvas ref={overlayRef} className={styles.overlay} />
      <canvas ref={frameRef} hidden />
      <header className={styles.header}>
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
      <div
        className={
          state === "ready"
            ? `${styles.status} ${styles.ready}`
            : state === "error"
              ? `${styles.status} ${styles.error}`
              : styles.status
        }
      >
        {state === "loading" ? (
          <LoaderCircle className={styles.spin} size={17} />
        ) : state === "ready" ? (
          <Check size={17} />
        ) : (
          <ScanLine size={17} />
        )}
        <span>{message}</span>
      </div>
      {recognition && (
        <div className={styles.score}>
          <b>
            {recognition.answers.reduce(
              (sum, answer, index) =>
                answer !== null && answer === standard[index] ? sum + (points[index] ?? 0) : sum,
              0,
            )}
          </b>
          <span>/ {totalScore} 分</span>
        </div>
      )}
      <footer className={styles.footer}>
        <button
          className={styles.capture}
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
  context: FrameContext,
  setState: (state: ScannerState) => void,
  setMessage: (message: string) => void,
  setRecognition: (recognition: Recognition | null) => void,
): Promise<FrameResult> {
  const { layout, options, standard, candidateNumberLength, warped: warpedCanvas } = context;
  let src: any;
  let gray: any;
  let binary: any;
  let contours: any;
  let hierarchy: any;
  let sourcePoints: any;
  let targetPoints: any;
  let transform: any;
  let inverse: any;
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
      return null;
    }
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
    // cv.invert 对奇异矩阵返回 0，此时 inverse 为垃圾值，后续 project 会得到 NaN 坐标（F2）
    if (!cv.invert(transform, inverse)) {
      setState("searching");
      setRecognition(null);
      setMessage("请让四个黑色定位方块完整进入画面");
      return null;
    }
    warped = new cv.Mat();
    cv.warpPerspective(
      src,
      warped,
      transform,
      warpSize(cv, layout.width, layout.height),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      whiteScalarInstance(cv),
    );
    // 复用同一个离屏画布：每帧新建 canvas 会让浏览器反复分配/回收上千像素的位图
    if (warpedCanvas.width !== layout.width || warpedCanvas.height !== layout.height) {
      warpedCanvas.width = layout.width;
      warpedCanvas.height = layout.height;
    }
    const warpedContext = warpedCanvas.getContext("2d", { willReadFrequently: true });
    if (!warpedContext) throw new Error("无法读取相机帧");
    cv.imshow(warpedCanvas, warped);
    const recognition = recognizeCard(
      warpedContext.getImageData(0, 0, layout.width, layout.height),
      layout,
      options,
      candidateNumberLength,
      true,
    );
    const inverseMatrix = Array.from(inverse.data64F as Float64Array);
    drawOverlay(overlay, corners, layout, inverseMatrix, recognition, standard);
    setRecognition(recognition);
    setState("ready");
    setMessage(
      recognition.answers.some((answer) => answer === null)
        ? "检测到未填或多填项，请检查标记"
        : "识别稳定，可确认阅卷",
    );
    return { recognition, signature: frameSignature(corners, recognition) };
  } catch {
    setState("searching");
    setRecognition(null);
    setMessage("正在调整识别，请保持答题卡平整并避免反光");
    return null;
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
      warped,
    ].forEach((value) => value?.delete());
  }
}

function drawOverlay(
  overlay: CanvasRenderingContext2D,
  corners: Point[],
  layout: CardLayout,
  inverse: number[],
  recognition: Recognition,
  standard: Option[],
) {
  overlay.lineWidth = 3;
  overlay.strokeStyle = "#36dfbd";
  const origin = corners[0];
  if (origin) {
    overlay.beginPath();
    overlay.moveTo(origin.x, origin.y);
    corners.slice(1).forEach((point) => overlay.lineTo(point.x, point.y));
    overlay.closePath();
    overlay.stroke();
  }
  layout.bubbles.forEach((bubble) => {
    const answer = recognition.answers[bubble.question];
    if (answer !== bubble.option) return;
    const point = project({ x: bubble.x, y: bubble.y }, inverse);
    const correct = answer === standard[bubble.question];
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
