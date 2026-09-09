import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
import styles from "./DeleteDialog.module.css";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

export default function DeleteDialog({
  name,
  label,
  onCancel,
  onConfirm,
}: {
  name: string;
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const sheetRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    // 保存触发元素引用，关闭时焦点返还；同时把背景内容 inert + aria-hidden（F15）
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const appRoot = document.getElementById("root");
    appRoot?.setAttribute("inert", "");
    appRoot?.setAttribute("aria-hidden", "true");
    sheetRef.current?.querySelector<HTMLButtonElement>(FOCUSABLE)?.focus();
    return () => {
      appRoot?.removeAttribute("inert");
      appRoot?.removeAttribute("aria-hidden");
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    const sheet = sheetRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !sheet) return;
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !sheet.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return createPortal(
    <div className={styles.backdrop}>
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={sheetRef}
      >
        <header>
          <button onClick={onCancel} aria-label="取消删除">
            <X size={21} />
          </button>
          <h2 id={titleId}>删除{label}</h2>
          <span />
        </header>
        <p id={descriptionId}>将删除“{name}”及相关数据，此操作无法撤销。</p>
        <div>
          <button onClick={onCancel}>取消</button>
          <button className={styles.danger} onClick={onConfirm}>
            <Trash2 size={18} />
            确认删除
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
