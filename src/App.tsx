import { useEffect, useState } from "react";
import { Check, Home, LayoutTemplate, ScanLine, UserRound, X, Plus } from "lucide-react";
import AnalysisPage from "./pages/AnalysisPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import ReviewPage from "./pages/ReviewPage";
import ScanPage from "./pages/ScanPage";
import TemplateDetailPage from "./pages/TemplateDetailPage";
import TemplatesPage from "./pages/TemplatesPage";
import { Page } from "./pages/Page";
import { gradeAnswers, GradedStudent } from "./lib/grading";
import { AnswerCardTemplate, createAnswers, OPTION_LABELS, Option, Recognition } from "./lib/omr";

const STORAGE_KEY = "answer-sheet-manager.templates";
const RECORDS_STORAGE_KEY = "answer-sheet-manager.records";

function loadTemplates(): AnswerCardTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function loadRecords(): Record<string, GradedStudent[]> {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function Toast({ message }: { message: string | null }) {
  return message ? (
    <div className="toast" role="status">
      <Check size={16} />
      {message}
    </div>
  ) : null;
}

function BottomNav({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  const items: Array<[Page, string, typeof Home]> = [
    ["home", "首页", Home],
    ["templates", "答题卡", LayoutTemplate],
    ["scan", "扫描", ScanLine],
    ["profile", "我的", UserRound],
  ];
  return (
    <nav className="bottom-nav">
      {items.map(([id, label, Icon]) => (
        <button
          key={id}
          aria-label={label}
          onClick={() => onChange(id)}
          className={page === id ? "active" : ""}
        >
          <span className={id === "scan" ? "scan-nav-icon" : ""}>
            <Icon size={id === "scan" ? 23 : 21} />
          </span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  );
}

function AnswerEditor({
  template,
  onSave,
  onClose,
}: {
  template: AnswerCardTemplate;
  onSave: (answers: Option[]) => void;
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState(template.answers);
  return (
    <div className="modal-backdrop">
      <section className="template-modal answer-modal">
        <header>
          <button onClick={onClose} aria-label="关闭答案设置">
            <X size={21} />
          </button>
          <h2>设置标准答案</h2>
          <button className="modal-save" onClick={() => onSave(answers)}>
            保存
          </button>
        </header>
        <p className="answer-modal-tip">
          每题仅支持一个正确选项。答案会作为实时对错浮层和最终判分依据。
        </p>
        <div className="answer-editor">
          {answers.map((answer, index) => (
            <div className="answer-row" key={index}>
              <span>第 {index + 1} 题</span>
              {OPTION_LABELS.map((option) => (
                <button
                  className={answer === option ? "on" : ""}
                  onClick={() =>
                    setAnswers((current) =>
                      current.map((value, item) => (item === index ? option : value)),
                    )
                  }
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
          ))}
        </div>
        <button className="create-template-button" onClick={() => onSave(answers)}>
          <Check size={19} />
          保存标准答案
        </button>
      </section>
    </div>
  );
}

function NewTemplate({
  onCreate,
  onClose,
}: {
  onCreate: (template: AnswerCardTemplate) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("数学");
  const [count, setCount] = useState(20);
  const create = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    onCreate({
      id: crypto.randomUUID(),
      name: cleanName,
      subject,
      questionCount: count,
      answers: createAnswers(count),
      createdAt: new Date().toISOString(),
    });
  };
  return (
    <div className="modal-backdrop">
      <section className="template-modal">
        <header>
          <button onClick={onClose} aria-label="关闭新建答题卡">
            <X size={21} />
          </button>
          <h2>新建答题卡</h2>
          <span></span>
        </header>
        <div className="form-block">
          <label>
            答题卡名称
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：第一单元测验"
              autoFocus
            />
          </label>
          <label>
            试卷科目
            <select value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option>数学</option>
              <option>语文</option>
              <option>英语</option>
              <option>物理</option>
              <option>化学</option>
            </select>
          </label>
          <label>
            单选题数量
            <div className="count-control">
              <button
                aria-label="减少题目数量"
                onClick={() => setCount((value) => Math.max(1, value - 1))}
              >
                −
              </button>
              <b>{count} 题</b>
              <button
                aria-label="增加题目数量"
                onClick={() => setCount((value) => Math.min(60, value + 1))}
              >
                +
              </button>
            </div>
          </label>
        </div>
        <button className="create-template-button" disabled={!name.trim()} onClick={create}>
          <Plus size={19} />
          创建标准答题卡
        </button>
      </section>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [templates, setTemplates] = useState(loadTemplates);
  const [selected, setSelected] = useState<AnswerCardTemplate | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [review, setReview] = useState<{ recognition: Recognition; fileName: string } | null>(null);
  const [records, setRecords] = useState<Record<string, GradedStudent[]>>(loadRecords);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(templates)), [templates]);
  useEffect(() => localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records)), [records]);
  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2200);
  };
  const create = (template: AnswerCardTemplate) => {
    setTemplates((current) => [template, ...current]);
    setSelected(template);
    setCreateOpen(false);
    setPage("detail");
    notify("标准答题卡已创建，请先设置答案并下载打印");
  };
  const select = (template: AnswerCardTemplate) => {
    setSelected(template);
    setPage("detail");
  };
  const saveAnswers = (answers: Option[]) => {
    if (!selected) return;
    const updated = { ...selected, answers };
    setTemplates((current) =>
      current.map((template) => (template.id === updated.id ? updated : template)),
    );
    setSelected(updated);
    setAnswerOpen(false);
    notify("标准答案已保存");
  };
  const scanned = (recognition: Recognition, fileName: string) => {
    if (!recognition.markerValid) {
      notify("未检测到完整定位标记，请使用实时相机重拍");
      return;
    }
    setReview({ recognition, fileName });
  };
  const saveReview = (answers: Array<Option | null>, confidence: number[]) => {
    if (!selected || !review) return;
    if (answers.some((answer) => answer === null)) {
      notify("请先补全所有题目");
      return;
    }
    const record = gradeAnswers(
      selected,
      `答卷 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`,
      review.fileName,
      answers,
      confidence,
    );
    setRecords((current) => ({
      ...current,
      [selected.id]: [...(current[selected.id] ?? []), record],
    }));
    setReview(null);
    setPage("analysis");
    notify("真实识别结果已保存");
  };

  return (
    <div className="mobile-app">
      {page === "home" && (
        <HomePage templates={templates} onPage={setPage} onCreate={() => setCreateOpen(true)} />
      )}
      {page === "templates" && (
        <TemplatesPage
          templates={templates}
          onCreate={() => setCreateOpen(true)}
          onSelect={select}
        />
      )}
      {page === "detail" && selected && (
        <TemplateDetailPage
          template={selected}
          onBack={() => setPage("templates")}
          onAnswers={() => setAnswerOpen(true)}
          onScan={() => setPage("scan")}
          notify={notify}
        />
      )}
      {page === "scan" && (
        <ScanPage
          template={selected ?? templates[0] ?? null}
          onSelect={() => setPage("templates")}
          onScanned={scanned}
          notify={notify}
        />
      )}
      {page === "analysis" && (
        <AnalysisPage
          template={selected}
          records={selected ? (records[selected.id] ?? []) : []}
          onBack={() => setPage("home")}
        />
      )}
      {page === "profile" && <ProfilePage templateCount={templates.length} onPage={setPage} />}
      {createOpen && <NewTemplate onCreate={create} onClose={() => setCreateOpen(false)} />}
      {answerOpen && selected && (
        <AnswerEditor
          template={selected}
          onSave={saveAnswers}
          onClose={() => setAnswerOpen(false)}
        />
      )}
      {review && selected && (
        <ReviewPage
          template={selected}
          recognition={review.recognition}
          fileName={review.fileName}
          onSave={saveReview}
          onCancel={() => setReview(null)}
        />
      )}
      <Toast message={message} />
      <BottomNav page={page} onChange={setPage} />
    </div>
  );
}
