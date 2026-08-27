export const OPTION_LABELS = ["A", "B", "C", "D"] as const;
export type Option = (typeof OPTION_LABELS)[number];

export type AnswerCardTemplate = {
  id: string;
  name: string;
  subject: string;
  questionCount: number;
  answers: Option[];
  createdAt: string;
};

export type Bubble = { question: number; option: Option; x: number; y: number; radius: number };
export type CardLayout = {
  width: number;
  height: number;
  markers: Array<{ x: number; y: number; size: number }>;
  bubbles: Bubble[];
};
export type Recognition = {
  answers: Array<Option | null>;
  confidence: number[];
  fillRates: number[][];
  markerValid: boolean;
};

const CARD_WIDTH = 900;
const MARKER_SIZE = 42;
const MARGIN = 46;

export function createAnswers(questionCount: number): Option[] {
  return Array.from({ length: questionCount }, () => "A");
}

export function createLayout(questionCount: number): CardLayout {
  const columns = questionCount > 30 ? 3 : 2;
  const rows = Math.ceil(questionCount / columns);
  const height = Math.max(1040, 310 + rows * 54 + 94);
  const markerPositions = [
    { x: MARGIN, y: MARGIN },
    { x: CARD_WIDTH - MARGIN - MARKER_SIZE, y: MARGIN },
    { x: MARGIN, y: height - MARGIN - MARKER_SIZE },
    { x: CARD_WIDTH - MARGIN - MARKER_SIZE, y: height - MARGIN - MARKER_SIZE },
  ];
  const columnWidth = (CARD_WIDTH - 160) / columns;
  const bubbles: Bubble[] = [];
  for (let question = 0; question < questionCount; question++) {
    const column = Math.floor(question / rows);
    const row = question % rows;
    const originX = 90 + column * columnWidth;
    const y = 304 + row * 54;
    OPTION_LABELS.forEach((option, index) =>
      bubbles.push({
        question,
        option,
        x: originX + 58 + index * 44,
        y,
        radius: 15,
      }),
    );
  }
  return {
    width: CARD_WIDTH,
    height,
    markers: markerPositions.map((marker) => ({ ...marker, size: MARKER_SIZE })),
    bubbles,
  };
}

export function drawAnswerCard(canvas: HTMLCanvasElement, template: AnswerCardTemplate) {
  const layout = createLayout(template.questionCount);
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持 Canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.fillStyle = "#111";
  layout.markers.forEach((marker) => ctx.fillRect(marker.x, marker.y, marker.size, marker.size));
  ctx.textAlign = "center";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(template.name, layout.width / 2, 122);
  ctx.font = "18px sans-serif";
  ctx.fillText("答题卡", layout.width / 2, 154);
  ctx.textAlign = "left";
  ctx.font = "16px sans-serif";
  ctx.fillText(`科目：${template.subject}`, 90, 204);
  ctx.fillText("班级：____________________", 330, 204);
  ctx.fillText("姓名：____________________", 605, 204);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1;
  ctx.strokeRect(78, 238, layout.width - 156, 42);
  ctx.font = "14px sans-serif";
  ctx.fillText("请使用 2B 铅笔填涂，保持定位方块完整清晰。每题只填涂一个选项。", 96, 264);
  const groups = new Map<number, Bubble[]>();
  layout.bubbles.forEach((bubble) =>
    groups.set(bubble.question, [...(groups.get(bubble.question) ?? []), bubble]),
  );
  groups.forEach((bubbles, question) => {
    const first = bubbles[0];
    ctx.fillStyle = "#222";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(question + 1).padStart(2, "0"), first.x - 22, first.y + 6);
    bubbles.forEach((bubble) => {
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "13px sans-serif";
      ctx.fillText(bubble.option, bubble.x, bubble.y + 4);
    });
  });
  ctx.textAlign = "center";
  ctx.fillStyle = "#777";
  ctx.font = "12px sans-serif";
  ctx.fillText("Answer Sheet Manager - 请勿裁切四角定位标记", layout.width / 2, layout.height - 72);
}

function cropAndScale(
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  target: CardLayout,
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("浏览器不支持 Canvas");
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = target.width / target.height;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, target.width, target.height);
  return ctx.getImageData(0, 0, target.width, target.height);
}

function darkness(data: ImageData, x: number, y: number, radius: number): number {
  let dark = 0;
  let count = 0;
  const minX = Math.max(0, Math.floor(x - radius));
  const maxX = Math.min(data.width - 1, Math.ceil(x + radius));
  const minY = Math.max(0, Math.floor(y - radius));
  const maxY = Math.min(data.height - 1, Math.ceil(y + radius));
  for (let py = minY; py <= maxY; py++)
    for (let px = minX; px <= maxX; px++) {
      const dx = px - x;
      const dy = py - y;
      if (dx * dx + dy * dy > radius * radius) continue;
      const index = (py * data.width + px) * 4;
      const luminance =
        data.data[index] * 0.299 + data.data[index + 1] * 0.587 + data.data[index + 2] * 0.114;
      if (luminance < 150) dark++;
      count++;
    }
  return count ? dark / count : 0;
}

export function hasValidMarkers(imageData: ImageData, layout: CardLayout): boolean {
  return layout.markers.every(
    (marker) =>
      darkness(
        imageData,
        marker.x + marker.size / 2,
        marker.y + marker.size / 2,
        marker.size * 0.3,
      ) >= 0.8,
  );
}

export function classifyFillRates(
  fillRates: number[][],
): Pick<Recognition, "answers" | "confidence"> {
  const answers: Array<Option | null> = [];
  const confidence: number[] = [];
  fillRates.forEach((rates) => {
    const sorted = rates
      .map((rate, index) => ({ rate, index }))
      .toSorted((a, b) => b.rate - a.rate);
    const top = sorted[0];
    const second = sorted[1];
    answers.push(
      top.rate >= 0.18 && top.rate - second.rate >= 0.06 ? OPTION_LABELS[top.index] : null,
    );
    confidence.push(Math.max(0, Math.min(1, (top.rate - second.rate) / 0.25)));
  });
  return { answers, confidence };
}

export function recognizeWarpedCard(
  imageData: ImageData,
  template: AnswerCardTemplate,
  markerValid = true,
): Recognition {
  const layout = createLayout(template.questionCount);
  const fillRates = Array.from({ length: template.questionCount }, () => Array(4).fill(0));
  layout.bubbles.forEach((bubble) => {
    fillRates[bubble.question][OPTION_LABELS.indexOf(bubble.option)] = darkness(
      imageData,
      bubble.x,
      bubble.y,
      bubble.radius * 0.57,
    );
  });
  return { ...classifyFillRates(fillRates), fillRates, markerValid };
}

export function recognizeAnswerCard(
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  template: AnswerCardTemplate,
): Recognition {
  const layout = createLayout(template.questionCount);
  const imageData = cropAndScale(image, sourceWidth, sourceHeight, layout);
  return recognizeWarpedCard(imageData, template, hasValidMarkers(imageData, layout));
}
