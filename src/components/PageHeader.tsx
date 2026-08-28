import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";
import styles from "./PageHeader.module.css";

type Props = {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  action?: ReactNode;
};

export default function PageHeader({ title, onBack, backLabel = "返回上一页", action }: Props) {
  return (
    <header className={`${styles.header}${onBack ? ` ${styles.withBack}` : ""}`}>
      {onBack ? (
        <button className={styles.backButton} aria-label={backLabel} onClick={onBack}>
          <ArrowLeft size={21} />
        </button>
      ) : null}
      <div className={styles.heading}>
        <h1>{title}</h1>
      </div>
      {action ?? <span aria-hidden="true" />}
    </header>
  );
}
