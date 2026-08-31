import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./Select.module.css";

type Option = { value: string; label: string };
type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  size?: "sm" | "md";
  disabled?: boolean;
};

export default function Select({
  value,
  options,
  onChange,
  ariaLabel,
  size = "md",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={`${styles.trigger} ${styles[size]}`}
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        <span>{current?.label ?? "请选择"}</span>
        <ChevronDown
          size={17}
          className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ""}`}
        />
      </button>
      {open && (
        <div className={styles.menu} role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`${styles.option}${option.value === value ? ` ${styles.selected}` : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
