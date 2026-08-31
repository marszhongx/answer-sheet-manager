import { ReactNode } from "react";
import styles from "./Note.module.css";

export default function Note({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}
