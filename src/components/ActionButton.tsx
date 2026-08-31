import { ReactNode } from "react";
import styles from "./ActionButton.module.css";

type Props = {
  icon?: ReactNode;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function ActionList({ children }: { children: ReactNode }) {
  return <section className={styles.list}>{children}</section>;
}

export default function ActionButton({
  icon,
  variant = "default",
  disabled,
  onClick,
  children,
}: Props) {
  const className = variant === "default" ? styles.button : `${styles.button} ${styles[variant]}`;
  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}
