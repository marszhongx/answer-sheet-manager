import { ComponentPropsWithoutRef } from "react";
import styles from "./FormSection.module.css";

export default function FormSection({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  const classes = [styles.section, className].filter(Boolean).join(" ");
  return <section {...props} className={classes} />;
}
