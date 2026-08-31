import { Check } from "lucide-react";
import { useAppStore } from "../store/appStore";
import styles from "./Toast.module.css";

export default function Toast() {
  const message = useAppStore((state) => state.message);
  return message ? (
    <div className={styles.toast} role="status">
      <Check size={16} />
      {message}
    </div>
  ) : null;
}
