import { Check } from "lucide-react";
import { useAppStore } from "../store/appStore";

export default function Toast() {
  const message = useAppStore((state) => state.message);
  return message ? (
    <div className="toast" role="status">
      <Check size={16} />
      {message}
    </div>
  ) : null;
}
