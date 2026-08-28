import { ComponentPropsWithoutRef } from "react";
import styles from "./FormSection.module.css";

type Props = ComponentPropsWithoutRef<"section"> & { card?: boolean; spaced?: boolean };

export default function FormSection({ className, card = false, spaced = false, ...props }: Props) {
  const classes = [styles.section, card && styles.card, spaced && styles.spaced, className]
    .filter(Boolean)
    .join(" ");
  return <section {...props} className={classes} />;
}
