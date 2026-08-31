import { ReactNode } from "react";
import styles from "./SubmitButton.module.css";

type Props = {
  icon?: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export default function SubmitButton({ icon, disabled, onClick, children }: Props) {
  return (
    <button type="button" className={styles.button} disabled={disabled} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}
