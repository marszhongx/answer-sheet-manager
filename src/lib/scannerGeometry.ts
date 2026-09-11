export type Point = { x: number; y: number };

function isClose(a: Point, b: Point): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < 12;
}

export function chooseCorners(points: Point[]): Point[] | null {
  if (points.length < 4) return null;
  const bySum = points.toSorted((a, b) => a.x + a.y - (b.x + b.y));
  const byDiff = points.toSorted((a, b) => a.x - a.y - (b.x - b.y));
  const notClose = (point: Point, used: Point[]) => !used.some((item) => isClose(point, item));
  const firstMatch = (candidates: Point[], used: Point[]) =>
    candidates.find((point) => notClose(point, used));
  const lastMatch = (candidates: Point[], used: Point[]) => {
    for (let index = candidates.length - 1; index >= 0; index--) {
      const point = candidates[index];
      if (point && notClose(point, used)) return point;
    }
    return undefined;
  };
  const selected: Point[] = [];
  const topLeft = firstMatch(bySum, selected);
  if (!topLeft) return null;
  selected.push(topLeft);
  const topRight = lastMatch(byDiff, selected);
  if (!topRight) return null;
  selected.push(topRight);
  const bottomRight = lastMatch(bySum, selected);
  if (!bottomRight) return null;
  selected.push(bottomRight);
  const bottomLeft = firstMatch(byDiff, selected);
  if (!bottomLeft) return null;
  const corners = [topLeft, topRight, bottomRight, bottomLeft];
  const lengths = corners.map((point, index) => {
    const next = corners[(index + 1) % corners.length] ?? point;
    return Math.hypot(next.x - point.x, next.y - point.y);
  });
  const area = Math.abs(
    corners.reduce((sum, point, index) => {
      const next = corners[(index + 1) % corners.length] ?? point;
      return sum + point.x * next.y - point.y * next.x;
    }, 0) / 2,
  );
  return area >= 20_000 &&
    Math.min(...lengths) >= 80 &&
    Math.max(...lengths) / Math.min(...lengths) <= 2.2
    ? corners
    : null;
}
