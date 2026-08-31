import type { ReactNode } from "react";
import styles from "./DetailPage.module.css";

interface DetailPageProps {
  children: ReactNode;
  className?: string;
}

export default function DetailPage({ children, className }: DetailPageProps) {
  return <main className={`${styles.detailPage} ${className ?? ""}`}>{children}</main>;
}
