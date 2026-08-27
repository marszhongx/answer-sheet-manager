import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import AnswerCardDetail from "./pages/AnswerCardDetail";
import TemplatesPage from "./pages/TemplatesPage";
import { AnswerCardTemplate, createAnswers, OPTION_LABELS, Option } from "./lib/omr";

const STORAGE_KEY = "answer-sheet-manager.templates";

function loadTemplates(): AnswerCardTemplate[] {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as AnswerCardTemplate[]).map(
      (template) => ({ ...template, records: template.records ?? [] }),
    );
  } catch {
    return [];
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
      records: [],
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
  const [templates, setTemplates] = useState(loadTemplates);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2200);
  };
  const create = (template: AnswerCardTemplate) => {
    setTemplates((current) => [template, ...current]);
    navigate(`/answer-sheets/${template.id}`);
    notify("标准答题卡已创建");
  };
  const copy = (template: AnswerCardTemplate) => {
    setTemplates((current) => [
      {
        ...template,
        id: crypto.randomUUID(),
        name: `${template.name} 副本`,
        answers: [...template.answers],
        records: [],
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    notify("已复制答题卡");
  };
  const saveAnswers = (template: AnswerCardTemplate, answers: Option[]) => {
    const updated = { ...template, answers };
    setTemplates((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setAnswerOpen(false);
    notify("标准答案已保存");
  };

  return (
    <div className="mobile-app">
      <Routes>
        <Route path="/" element={<Navigate to="/answer-sheets" replace />} />
        <Route
          path="/answer-sheets"
          element={
            <TemplatesPage
              templates={templates}
              onCreate={() => navigate("/answer-sheets/new")}
              onCopy={copy}
              onSelect={(template) => navigate(`/answer-sheets/${template.id}`)}
            />
          }
        />
        <Route
          path="/answer-sheets/new"
          element={
            <>
              <TemplatesPage
                templates={templates}
                onCreate={() => navigate("/answer-sheets/new")}
                onCopy={copy}
                onSelect={(template) => navigate(`/answer-sheets/${template.id}`)}
              />
              <NewTemplate onCreate={create} onClose={() => navigate("/answer-sheets")} />
            </>
          }
        />
        <Route
          path="/answer-sheets/:id"
          element={
            <AnswerSheetRoute
              templates={templates}
              answerOpen={answerOpen}
              onBack={() => navigate("/answer-sheets")}
              onAnswers={() => setAnswerOpen(true)}
              onSaveAnswers={saveAnswers}
              onCloseAnswers={() => setAnswerOpen(false)}
              notify={notify}
            />
          }
        />
        <Route path="*" element={<Navigate to="/answer-sheets" replace />} />
      </Routes>
      <Toast message={message} />
    </div>
  );
}

function AnswerSheetRoute({
  templates,
  answerOpen,
  onBack,
  onAnswers,
  onSaveAnswers,
  onCloseAnswers,
  notify,
}: {
  templates: AnswerCardTemplate[];
  answerOpen: boolean;
  onBack: () => void;
  onAnswers: () => void;
  onSaveAnswers: (template: AnswerCardTemplate, answers: Option[]) => void;
  onCloseAnswers: () => void;
  notify: (text: string) => void;
}) {
  const { id } = useParams();
  const template = templates.find((item) => item.id === id);
  if (!template) return <Navigate to="/answer-sheets" replace />;
  return (
    <>
      <AnswerCardDetail template={template} onBack={onBack} onAnswers={onAnswers} notify={notify} />
      {answerOpen && (
        <AnswerEditor
          template={template}
          onSave={(answers) => onSaveAnswers(template, answers)}
          onClose={onCloseAnswers}
        />
      )}
    </>
  );
}
