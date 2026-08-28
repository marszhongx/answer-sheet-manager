import { InputHTMLAttributes } from "react";
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
  const setValue = (next: number) => onChange(Math.min(max, Math.max(min, next)));
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
        onClick={() => setValue(value - 1)}
      >
        <Minus size={15} />
      </button>
      <input
        {...props}
        className={styles.input}
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => setValue(Number(event.target.value) || min)}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
      <button
        className={styles.button}
        type="button"
        aria-label="增加"
        disabled={value >= max}
        onClick={() => setValue(value + 1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
