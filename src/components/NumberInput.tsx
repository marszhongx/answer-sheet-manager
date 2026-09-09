import { InputHTMLAttributes, useState } from "react";
import { Minus, Plus } from "lucide-react";
import styles from "./NumberInput.module.css";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "size"> & {
  value: number;
  min: number;
  max: number;
  suffix?: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  compact?: boolean;
  onChange: (value: number) => void;
};

// 显式地把 type=number 的字符串草稿转成数字并夹取到 [min, max]，消除对 Number() 隐式转换的依赖（F16）。
function parseDraft(raw: string, min: number, max: number): number {
  if (raw === "") return min;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

export default function NumberInput({
  value,
  min,
  max,
  suffix,
  size = "md",
  fullWidth = false,
  compact = false,
  onChange,
  className,
  ...props
}: Props) {
  const [draft, setDraft] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setDraft(String(value));
  }
  const commit = (raw: string) => {
    const next = parseDraft(raw, min, max);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };
  const step = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    setDraft(String(clamped));
    onChange(clamped);
  };
  const classes = [
    styles.root,
    styles[size],
    fullWidth && styles.fullWidth,
    compact && styles.compact,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <button
        className={styles.button}
        type="button"
        aria-label="减少"
        disabled={value <= min}
        onClick={() => step(value - 1)}
      >
        <Minus size={15} />
      </button>
      <input
        {...props}
        className={styles.input}
        type="number"
        value={draft}
        min={min}
        max={max}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit(draft);
        }}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
      <button
        className={styles.button}
        type="button"
        aria-label="增加"
        disabled={value >= max}
        onClick={() => step(value + 1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
