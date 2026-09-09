import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
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
  const [highlight, setHighlight] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((option) => option.value === value) ?? options[0];
  const currentIndex = options.findIndex((option) => option.value === value);
  const optionId = (index: number) => `${listId}-option-${index}`;

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const openMenu = () => {
    setHighlight(currentIndex < 0 ? 0 : currentIndex);
    setOpen(true);
  };
  const choose = (option: Option) => {
    onChange(option.value);
    setOpen(false);
  };
  const moveHighlight = (next: number) => {
    if (!options.length) return;
    setHighlight((next + options.length) % options.length);
  };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) {
          openMenu();
          return;
        }
        moveHighlight(highlight + (event.key === "ArrowDown" ? 1 : -1));
        return;
      }
      case "Home":
        if (!open) return;
        event.preventDefault();
        setHighlight(0);
        return;
      case "End":
        if (!open) return;
        event.preventDefault();
        setHighlight(options.length - 1);
        return;
      case "Enter":
      case " ":
        if (!open) return;
        event.preventDefault();
        if (options[highlight]) choose(options[highlight]);
        return;
      case "Escape":
        if (!open) return;
        event.preventDefault();
        setOpen(false);
        return;
    }
  };

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={`${styles.trigger} ${styles[size]}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span>{current?.label ?? "请选择"}</span>
        <ChevronDown
          size={17}
          className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ""}`}
        />
      </button>
      {open && (
        <div
          id={listId}
          className={styles.menu}
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={highlight >= 0 ? optionId(highlight) : undefined}
        >
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              id={optionId(index)}
              aria-selected={option.value === value}
              className={`${styles.option}${option.value === value ? ` ${styles.selected}` : ""}${
                index === highlight ? ` ${styles.optionActive}` : ""
              }`}
              key={option.value}
              onClick={() => choose(option)}
              onMouseEnter={() => setHighlight(index)}
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
