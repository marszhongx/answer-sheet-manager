import { Plus } from "lucide-react";
import styles from "./AddButton.module.css";

type Props = { label: string; onClick: () => void };

export default function AddButton({ label, onClick }: Props) {
  return (
    <button type="button" className={styles.button} onClick={onClick} aria-label={label}>
      <Plus size={20} />
    </button>
  );
}
