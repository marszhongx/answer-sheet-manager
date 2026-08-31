export const OPTION_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;
export type Option = (typeof OPTION_LABELS)[number];

export type QuestionSection = {
  id: string;
  name: string;
  questionCount: number;
  pointsPerQuestion: number;
  optionCount: number;
};

export type AnswerCardTemplate = {
  id: string;
  name: string;
  subject: string;
  candidateNumberLength: number;
  questionCount: number;
  sections?: QuestionSection[];
  answers: Option[];
  createdAt: string;
};

export type Bubble = { question: number; option: Option; x: number; y: number; radius: number };
export type StudentNumberBubble = {
  digitIndex: number;
  value: number;
  x: number;
  y: number;
  radius: number;
};
export type CardLayout = {
  width: number;
  height: number;
  answerDividerX: number;
  candidateDividerY: number;
  candidateStartX: number;
  candidateColumnGap: number;
  candidateStartY: number;
  identityLineEnd: number;
  markers: Array<{ x: number; y: number; size: number }>;
  bubbles: Bubble[];
  studentNumberBubbles: StudentNumberBubble[];
};
export type Recognition = {
  answers: Array<Option | null>;
  confidence: number[];
  fillRates: number[][];
  markerValid: boolean;
  studentNumber: string | null;
};

const ROWS_PER_COLUMN = 20;
const A4_DOUBLE_CARD_GAP = 24;
const OUTER_PADDING = 42;
const IDENTITY_MIN_WIDTH = 220;
const IDENTITY_LABEL_WIDTH = 46;
const CANDIDATE_LABEL_GAP = 22;
const IDENTITY_FIELD_LINE_START = 116;
const IDENTITY_FIELD_LINE_MIN_WIDTH = 112;
const IDENTITY_FIELD_LINE_END_PADDING = 18;
const REGION_PADDING = 24;
const CANDIDATE_HORIZONTAL_PADDING = REGION_PADDING;
const QUESTION_NUMBER_WIDTH = 48;
const ANSWER_AREA_PADDING = REGION_PADDING;
const OPTION_CELL_WIDTH = 46;
const OPTION_GAP = 0;
const COLUMN_GAP = 18;
const ROW_HEIGHT = 28;
const TOP_OFFSET = 112;
const MARKER_SIZE = 28;
const CANDIDATE_TEXT_HEIGHT = 22;
const CANDIDATE_DIVIDER_Y = 390;
const CANDIDATE_ROW_GAP = 27;
const DEFAULT_CANDIDATE_LENGTH = 2;
const A4_PORTRAIT = { width: 1200, height: 1697 };
const A4_LANDSCAPE = { width: 1697, height: 1200 };

export function defaultSections(questionCount = 20): QuestionSection[] {
  return [
    { id: "section-1", name: "第一大题", questionCount, pointsPerQuestion: 5, optionCount: 4 },
  ];
}

export function templateSections(template: AnswerCardTemplate): QuestionSection[] {
  return template.sections?.length ? template.sections : defaultSections(template.questionCount);
}

export function questionOptions(template: AnswerCardTemplate): Option[][] {
  return templateSections(template).flatMap((section) =>
    Array.from({ length: section.questionCount }, () =>
      OPTION_LABELS.slice(0, Math.max(2, Math.min(OPTION_LABELS.length, section.optionCount))),
    ),
  );
}

export function questionPoints(template: AnswerCardTemplate): number[] {
  return templateSections(template).flatMap((section) =>
    Array.from({ length: section.questionCount }, () => section.pointsPerQuestion),
  );
}

export function createAnswers(questionCount: number): Option[] {
  return Array.from({ length: questionCount }, () => "A");
}

export function createLayout(
  questionCount: number,
  candidateNumberLength = DEFAULT_CANDIDATE_LENGTH,
  optionCounts: number[] = Array.from({ length: questionCount }, () => 4),
): CardLayout {
  const safeQuestionCount = Math.max(1, questionCount);
  const safeCandidateLength = Math.max(1, Math.min(10, candidateNumberLength));
  const candidateContentWidth =
    safeCandidateLength * OPTION_CELL_WIDTH + (safeCandidateLength - 1) * OPTION_GAP;
  const identityWidth = Math.max(
    IDENTITY_MIN_WIDTH,
    IDENTITY_LABEL_WIDTH +
      CANDIDATE_LABEL_GAP +
      candidateContentWidth +
      CANDIDATE_HORIZONTAL_PADDING * 2,
  );
  const columns = Math.max(1, Math.ceil(safeQuestionCount / ROWS_PER_COLUMN));
  const rows = Math.min(ROWS_PER_COLUMN, safeQuestionCount);
  const maxOptionCount = Math.max(2, Math.min(OPTION_LABELS.length, Math.max(...optionCounts, 4)));
  const questionCellWidth =
    QUESTION_NUMBER_WIDTH + maxOptionCount * OPTION_CELL_WIDTH + (maxOptionCount - 1) * OPTION_GAP;
  const answerDividerX = OUTER_PADDING + identityWidth;
  const candidateDividerY = CANDIDATE_DIVIDER_Y;
  const candidateStartY = candidateDividerY + REGION_PADDING + CANDIDATE_TEXT_HEIGHT / 2;
  const candidateLastBaseline = candidateStartY + 9 * CANDIDATE_ROW_GAP;
  const answerLastBaseline = TOP_OFFSET + (rows - 1) * ROW_HEIGHT;
  const width =
    OUTER_PADDING * 2 +
    identityWidth +
    ANSWER_AREA_PADDING * 2 +
    columns * questionCellWidth +
    (columns - 1) * COLUMN_GAP;
  const height = Math.max(
    answerLastBaseline + OPTION_CELL_WIDTH / 2 + REGION_PADDING + OUTER_PADDING,
    candidateLastBaseline + CANDIDATE_TEXT_HEIGHT / 2 + REGION_PADDING + OUTER_PADDING,
  );
  const candidateStartX =
    OUTER_PADDING + IDENTITY_LABEL_WIDTH + CANDIDATE_LABEL_GAP + CANDIDATE_HORIZONTAL_PADDING;
  const candidateColumnGap = OPTION_CELL_WIDTH + OPTION_GAP;
  const identityLineEnd = Math.max(
    IDENTITY_FIELD_LINE_START + IDENTITY_FIELD_LINE_MIN_WIDTH,
    answerDividerX - IDENTITY_FIELD_LINE_END_PADDING,
  );
  const markers = [
    { x: OUTER_PADDING, y: OUTER_PADDING },
    { x: width - OUTER_PADDING - MARKER_SIZE, y: OUTER_PADDING },
    { x: OUTER_PADDING, y: height - OUTER_PADDING - MARKER_SIZE },
    { x: width - OUTER_PADDING - MARKER_SIZE, y: height - OUTER_PADDING - MARKER_SIZE },
  ];
  const bubbles: Bubble[] = [];
  const studentNumberBubbles: StudentNumberBubble[] = [];
  for (let digitIndex = 0; digitIndex < safeCandidateLength; digitIndex++) {
    for (let value = 0; value <= 9; value++) {
      studentNumberBubbles.push({
        digitIndex,
        value,
        x: candidateStartX + digitIndex * candidateColumnGap,
        y: candidateStartY + value * CANDIDATE_ROW_GAP,
        radius: OPTION_CELL_WIDTH / 2,
      });
    }
  }
  for (let question = 0; question < safeQuestionCount; question++) {
    const column = Math.floor(question / ROWS_PER_COLUMN);
    const row = question % ROWS_PER_COLUMN;
    const optionCount = Math.max(2, Math.min(OPTION_LABELS.length, optionCounts[question] ?? 4));
    const questionStartX =
      answerDividerX + ANSWER_AREA_PADDING + column * (questionCellWidth + COLUMN_GAP);
    const y = TOP_OFFSET + row * ROW_HEIGHT;
    OPTION_LABELS.slice(0, optionCount).forEach((option, index) => {
      bubbles.push({
        question,
        option,
        x:
          questionStartX +
          QUESTION_NUMBER_WIDTH +
          index * (OPTION_CELL_WIDTH + OPTION_GAP) +
          OPTION_CELL_WIDTH / 2,
        y,
        radius: OPTION_CELL_WIDTH / 2,
      });
    });
  }
  return {
    width,
    height,
    candidateStartX,
    candidateColumnGap,
    candidateStartY,
    identityLineEnd,
    candidateDividerY,
    answerDividerX,
    markers: markers.map((marker) => ({ ...marker, size: MARKER_SIZE })),
    bubbles,
    studentNumberBubbles,
  };
}

export function drawAnswerCard(canvas: HTMLCanvasElement, template: AnswerCardTemplate) {
  const options = questionOptions(template);
  const layout = createLayout(
    template.questionCount,
    template.candidateNumberLength ?? DEFAULT_CANDIDATE_LENGTH,
    options.map((item) => item.length),
  );
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持 Canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.strokeStyle = "#111";
  ctx.fillStyle = "#111";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    OUTER_PADDING,
    OUTER_PADDING,
    layout.width - OUTER_PADDING * 2,
    layout.height - OUTER_PADDING * 2,
  );
  layout.markers.forEach((marker) => ctx.fillRect(marker.x, marker.y, marker.size, marker.size));

  ctx.textAlign = "center";
  ctx.font = "bold 25px sans-serif";
  ctx.fillText("答题卡", (OUTER_PADDING + layout.answerDividerX) / 2, 112);
  ctx.textAlign = "left";
  ctx.font = "18px sans-serif";
  ctx.fillText("姓名：", 64, 190);
  ctx.fillText("班级：", 64, 262);
  ctx.fillText("学号：", 64, 334);
  ctx.lineWidth = 1;
  [190, 262, 334].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(IDENTITY_FIELD_LINE_START, y + 5);
    ctx.lineTo(layout.identityLineEnd, y + 5);
    ctx.stroke();
  });
  ctx.lineWidth = 2;
  const answerDividerX = layout.answerDividerX;
  const candidateDividerY = layout.candidateDividerY;
  ctx.beginPath();
  ctx.moveTo(answerDividerX, OUTER_PADDING);
  ctx.lineTo(answerDividerX, layout.height - OUTER_PADDING);
  ctx.moveTo(OUTER_PADDING, candidateDividerY);
  ctx.lineTo(answerDividerX, candidateDividerY);
  ctx.stroke();
  ctx.font = "bold 19px sans-serif";
  ["准", "考", "证", "号"].forEach((text, index) =>
    ctx.fillText(text, OUTER_PADDING + 28, layout.candidateStartY + 36 + index * 52),
  );
  layout.studentNumberBubbles.forEach((bubble) => {
    ctx.textAlign = "center";
    ctx.font = "16px sans-serif";
    ctx.fillText(`【 ${bubble.value} 】`, bubble.x, bubble.y + 5);
  });
  const groups = new Map<number, Bubble[]>();
  layout.bubbles.forEach((bubble) =>
    groups.set(bubble.question, [...(groups.get(bubble.question) ?? []), bubble]),
  );
  groups.forEach((bubbles, question) => {
    const first = bubbles[0];
    ctx.fillStyle = "#222";
    ctx.font = "17px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(question + 1), first.x - QUESTION_NUMBER_WIDTH + 13, first.y + 6);
    bubbles.forEach((bubble) => {
      ctx.textAlign = "center";
      ctx.font = "16px sans-serif";
      ctx.fillText(`【 ${bubble.option} 】`, bubble.x, bubble.y + 5);
    });
  });
}

function cardLayout(template: AnswerCardTemplate): CardLayout {
  const options = questionOptions(template);
  return createLayout(
    template.questionCount,
    template.candidateNumberLength ?? DEFAULT_CANDIDATE_LENGTH,
    options.map((item) => item.length),
  );
}

export type A4Fit = { portrait: boolean; landscape: boolean };

export function a4Fit(template: AnswerCardTemplate): A4Fit {
  const layout = cardLayout(template);
  return {
    portrait:
      layout.width <= A4_PORTRAIT.width &&
      layout.height * 2 + A4_DOUBLE_CARD_GAP <= A4_PORTRAIT.height,
    landscape: layout.width <= A4_LANDSCAPE.width && layout.height <= A4_LANDSCAPE.height,
  };
}

export function fitsA4(template: AnswerCardTemplate): boolean {
  const fit = a4Fit(template);
  return fit.portrait || fit.landscape;
}

export function drawA4PrintPage(canvas: HTMLCanvasElement, template: AnswerCardTemplate): boolean {
  const layout = cardLayout(template);
  const fit = a4Fit(template);
  if (!fit.portrait && !fit.landscape) return false;
  const card = document.createElement("canvas");
  drawAnswerCard(card, template);
  const page = fit.portrait ? A4_PORTRAIT : A4_LANDSCAPE;
  const twoCards = fit.portrait;
  const gap = twoCards ? A4_DOUBLE_CARD_GAP : 0;
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持 Canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, page.width, page.height);
  const left = (page.width - layout.width) / 2;
  if (twoCards) {
    const top = (page.height - (layout.height * 2 + gap)) / 2;
    ctx.drawImage(card, left, top, layout.width, layout.height);
    ctx.drawImage(card, left, top + layout.height + gap, layout.width, layout.height);
    ctx.strokeStyle = "#555";
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(40, top + layout.height + gap / 2);
    ctx.lineTo(page.width - 40, top + layout.height + gap / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.drawImage(card, left, (page.height - layout.height) / 2, layout.width, layout.height);
  }
  return true;
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
  let sx = 0,
    sy = 0,
    sw = sourceWidth,
    sh = sourceHeight;
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
  let dark = 0,
    count = 0;
  for (
    let py = Math.max(0, Math.floor(y - radius));
    py <= Math.min(data.height - 1, Math.ceil(y + radius));
    py++
  )
    for (
      let px = Math.max(0, Math.floor(x - radius));
      px <= Math.min(data.width - 1, Math.ceil(x + radius));
      px++
    ) {
      const dx = px - x,
        dy = py - y;
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
  options: Option[][],
): Pick<Recognition, "answers" | "confidence"> {
  const answers: Array<Option | null> = [];
  const confidence: number[] = [];
  fillRates.forEach((rates, question) => {
    const sorted = rates.map((rate, index) => ({ rate, index })).toSorted((a, b) => b.rate - a.rate);
    answers.push(
      sorted[0].rate >= 0.18 && sorted[0].rate - sorted[1].rate >= 0.06
        ? options[question][sorted[0].index]
        : null,
    );
    confidence.push(Math.max(0, Math.min(1, (sorted[0].rate - sorted[1].rate) / 0.25)));
  });
  return { answers, confidence };
}

export function recognizeWarpedCard(
  imageData: ImageData,
  template: AnswerCardTemplate,
  markerValid = true,
): Recognition {
  const options = questionOptions(template);
  const layout = cardLayout(template);
  const fillRates = options.map((item) => Array(item.length).fill(0));
  layout.bubbles.forEach((bubble) => {
    fillRates[bubble.question][options[bubble.question].indexOf(bubble.option)] = darkness(
      imageData,
      bubble.x,
      bubble.y,
      bubble.radius * 0.57,
    );
  });
  const studentLength = template.candidateNumberLength ?? DEFAULT_CANDIDATE_LENGTH;
  const studentRates = Array.from({ length: studentLength }, () => Array(10).fill(0));
  layout.studentNumberBubbles.forEach((bubble) => {
    studentRates[bubble.digitIndex][bubble.value] = darkness(
      imageData,
      bubble.x,
      bubble.y,
      bubble.radius * 0.7,
    );
  });
  const digits = studentRates.map((rates) => {
    const sorted = rates.map((rate, value) => ({ rate, value })).toSorted((a, b) => b.rate - a.rate);
    return sorted[0].rate >= 0.18 && sorted[0].rate - sorted[1].rate >= 0.06
      ? String(sorted[0].value)
      : null;
  });
  return {
    ...classifyFillRates(fillRates, options),
    fillRates,
    markerValid,
    studentNumber: digits.every((digit) => digit !== null) ? digits.join("") : null,
  };
}

export function recognizeAnswerCard(
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  template: AnswerCardTemplate,
): Recognition {
  const layout = cardLayout(template);
  const imageData = cropAndScale(image, sourceWidth, sourceHeight, layout);
  return recognizeWarpedCard(imageData, template, hasValidMarkers(imageData, layout));
}
