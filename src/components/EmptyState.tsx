import { Plus } from "lucide-react";
import { ReactNode } from "react";
import styles from "./EmptyState.module.css";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  card?: boolean;
};

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  card = false,
}: Props) {
  return (
    <section className={card ? `${styles.empty} ${styles.card}` : styles.empty}>
      {icon}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction}>
          <Plus size={18} />
          {actionLabel}
        </button>
      )}
    </section>
  );
}
