import { ClipboardList, LayoutTemplate, UsersRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = [
    ["/answer-sheets", "答题卡", LayoutTemplate],
    ["/exams", "考试管理", ClipboardList],
    ["/students", "班级管理", UsersRound],
  ] as const;
  return (
    <nav className="bottom-nav">
      {items.map(([to, label, Icon]) => (
        <button
          key={to}
          aria-label={label}
          className={pathname.startsWith(to) ? "active" : ""}
          onClick={() => navigate(to)}
        >
          <span>
            <Icon size={21} />
          </span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  );
}
