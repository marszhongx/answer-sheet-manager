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
    const next = raw === "" ? min : Math.min(max, Math.max(min, Number(raw) || min));
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
