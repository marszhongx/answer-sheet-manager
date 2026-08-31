import type { ReactNode } from "react";
import styles from "./PrintPreview.module.css";

interface PrintPreviewProps {
  printable: boolean;
  errorText: string;
  children: ReactNode;
}

export default function PrintPreview({ printable, errorText, children }: PrintPreviewProps) {
  return printable ? (
    <div className={styles.preview}>{children}</div>
  ) : (
    <div className={styles.error}>{errorText}</div>
  );
}
