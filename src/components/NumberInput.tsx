import { InputHTMLAttributes } from "react";
import { Minus, Plus } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
};

export default function NumberInput({
  value,
  min,
  max,
  suffix,
  onChange,
  className,
  ...props
}: Props) {
  const setValue = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  return (
    <div className={`number-input${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        aria-label="减少"
        disabled={value <= min}
        onClick={() => setValue(value - 1)}
      >
        <Minus size={15} />
      </button>
      <input
        {...props}
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => setValue(Number(event.target.value) || min)}
      />
      {suffix && <span>{suffix}</span>}
      <button
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
