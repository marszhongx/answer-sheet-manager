import type { ReactNode } from "react";
import styles from "./Page.module.css";

interface PageProps {
  children: ReactNode;
  className?: string;
}

export default function Page({ children, className }: PageProps) {
  return <main className={`${styles.page} ${className ?? ""}`}>{children}</main>;
}
