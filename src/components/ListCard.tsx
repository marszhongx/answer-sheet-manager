import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";
import styles from "./ListCard.module.css";

type Props = {
  leading: ReactNode;
  tags?: string[];
  title: ReactNode;
  description?: ReactNode;
  onClick: () => void;
  action?: ReactNode;
};

export default function ListCard({ leading, tags, title, description, onClick, action }: Props) {
  const content = (
    <>
      <span className={styles.leading}>{leading}</span>
      <span className={styles.content}>
        <span className={styles.titleLine}>
          <strong>{title}</strong>
          {tags?.length ? (
            <span className={styles.tags}>
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </span>
          ) : null}
        </span>
        {description && <small>{description}</small>}
      </span>
      <ChevronRight className={styles.arrow} size={19} />
    </>
  );

  return action ? (
    <article className={styles.card}>
      <button type="button" className={styles.main} onClick={onClick}>
        {content}
      </button>
      <div className={styles.action}>{action}</div>
    </article>
  ) : (
    <button type="button" className={`${styles.card} ${styles.fullCard}`} onClick={onClick}>
      {content}
    </button>
  );
}
