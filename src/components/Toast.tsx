import { Check, TriangleAlert } from "lucide-react";
import { useAppStore } from "../store/appStore";
import styles from "./Toast.module.css";

export default function Toast() {
  const message = useAppStore((state) => state.message);
  const tone = useAppStore((state) => state.messageTone);
  if (!message) return null;
  const isError = tone === "error";
  return (
    <div
      className={isError ? `${styles.toast} ${styles.error}` : styles.toast}
      role={isError ? "alert" : "status"}
    >
      {isError ? <TriangleAlert size={16} /> : <Check size={16} />}
      {message}
    </div>
  );
}
