import { ReactNode } from "react";
import styles from "./InfoList.module.css";

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span>{label}</span>
      <b>{children}</b>
    </div>
  );
}

type Props = { children: ReactNode; scroll?: boolean };

export default function InfoList({ children, scroll = false }: Props) {
  return (
    <section className={`${styles.list}${scroll ? ` ${styles.scroll}` : ""}`}>{children}</section>
  );
}
