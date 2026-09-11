import {
  AnswerSheet,
  CardLayout,
  createLayout,
  questionCount,
  questionOptions,
  Recognition,
  recognizeCard,
} from "./omr";
import { getOpenCv } from "./opencv";
import { chooseCorners, Point } from "./scannerGeometry";

let warpSizeCache: { width: number; height: number; instance: any } | null = null;
let whiteScalar: any = null;

function warpSize(cv: any, width: number, height: number): any {
  if (warpSizeCache?.width === width && warpSizeCache.height === height) {
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

function findMarkerCorners(cv: any, source: any): Point[] | null {
  const gray = new cv.Mat();
  const binary = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  try {
    cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, 92, 255, cv.THRESH_BINARY_INV);
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    const candidates: Point[] = [];
    for (let index = 0; index < contours.size(); index++) {
      const contour = contours.get(index);
      try {
        const rect = cv.boundingRect(contour);
        const ratio = rect.width / rect.height;
        if (
          rect.width >= 11 &&
          rect.height >= 11 &&
          rect.width <= 90 &&
          rect.height <= 90 &&
          ratio >= 0.72 &&
          ratio <= 1.28 &&
          rect.width * rect.height >= 170
        ) {
          candidates.push({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
        }
      } finally {
        contour.delete();
      }
    }
    return chooseCorners(candidates);
  } finally {
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
  }
}

export async function recognizeImageWithOpenCv(
  image: CanvasImageSource,
  answerSheet: AnswerSheet,
): Promise<Recognition> {
  const cv = await getOpenCv();
  const options = questionOptions(answerSheet);
  const layout: CardLayout = createLayout(
    questionCount(answerSheet),
    answerSheet.candidateNumberLength,
    options.map((item) => item.length),
  );
  let source: any;
  let detectionSource: any;
  let corners: Point[] | null = null;
  let sourcePoints: any;
  let targetPoints: any;
  let transform: any;
  let warped: any;
  try {
    source = cv.imread(image);
    const scale = Math.min(1, 1280 / Math.max(source.cols, source.rows));
    if (scale < 1) {
      detectionSource = new cv.Mat();
      cv.resize(source, detectionSource, new cv.Size(0, 0), scale, scale, cv.INTER_AREA);
    } else {
      detectionSource = source;
    }
    corners = findMarkerCorners(cv, detectionSource);
    if (!corners) throw new Error("未找到答题卡四个定位方块");
    if (scale < 1) {
      corners = corners.map((point) => ({ x: point.x / scale, y: point.y / scale }));
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
    warped = new cv.Mat();
    cv.warpPerspective(
      source,
      warped,
      transform,
      warpSize(cv, layout.width, layout.height),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      whiteScalarInstance(cv),
    );
    const canvas = document.createElement("canvas");
    canvas.width = layout.width;
    canvas.height = layout.height;
    cv.imshow(canvas, warped);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("无法读取图片");
    return recognizeCard(
      context.getImageData(0, 0, layout.width, layout.height),
      layout,
      options,
      answerSheet.candidateNumberLength,
      true,
    );
  } finally {
    if (detectionSource && detectionSource !== source) detectionSource.delete();
    [source, sourcePoints, targetPoints, transform, warped].forEach((value) => value?.delete());
  }
}
