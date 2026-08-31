import { Trash2, X } from "lucide-react";
import styles from "./DeleteDialog.module.css";

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
  return (
    <div className={styles.backdrop}>
      <section className={styles.sheet} role="dialog" aria-modal="true">
        <header>
          <button onClick={onCancel} aria-label="取消删除">
            <X size={21} />
          </button>
          <h2>删除{label}</h2>
          <span />
        </header>
        <p>将删除“{name}”及相关数据，此操作无法撤销。</p>
        <div>
          <button onClick={onCancel}>取消</button>
          <button className={styles.danger} onClick={onConfirm}>
            <Trash2 size={18} />
            确认删除
          </button>
        </div>
      </section>
    </div>
  );
}
