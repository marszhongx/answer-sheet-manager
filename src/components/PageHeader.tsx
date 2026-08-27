import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  action?: ReactNode;
};

export default function PageHeader({ title, onBack, backLabel = "返回上一页", action }: Props) {
  const heading = (
    <div>
      <h1>{title}</h1>
    </div>
  );
  const backButton = onBack ? (
    <button className="header-icon" aria-label={backLabel} onClick={onBack}>
      <ArrowLeft size={21} />
    </button>
  ) : null;

  return (
    <header className={`page-top${onBack ? " page-top-with-back" : ""}`}>
      {backButton}
      {heading}
      {action ?? <span aria-hidden="true" />}
    </header>
  );
}
