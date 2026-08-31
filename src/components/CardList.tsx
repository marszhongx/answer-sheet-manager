import type { ReactNode } from "react";
import styles from "./CardList.module.css";

export default function CardList({ children }: { children: ReactNode }) {
  return <div className={styles.list}>{children}</div>;
}
