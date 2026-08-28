import { InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: "sm" | "md" };

export default function Input({ size = "md", className, ...props }: Props) {
  return (
    <input
      {...props}
      className={`${styles.input} ${styles[size]}${className ? ` ${className}` : ""}`}
    />
  );
}
