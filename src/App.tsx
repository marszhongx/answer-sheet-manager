import { useEffect, useState } from "react";
import Input from "./components/Input";
import { Check, ClipboardList, LayoutTemplate, Trash2, UsersRound, X } from "lucide-react";
import PageHeader from "./components/PageHeader";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { gradeAnswers } from "./lib/grading";
import { AnswerCardTemplate, Option, Recognition } from "./lib/omr";
import { Exam } from "./lib/exam";
import { ClassRoster, findStudent } from "./lib/roster";
import AnalysisPage from "./pages/AnalysisPage";
import ClassDetailPage from "./pages/ClassDetailPage";
import ClassEditorPage from "./pages/ClassEditorPage";
import ExamDetailPage from "./pages/ExamDetailPage";
import ExamsPage from "./pages/ExamsPage";
import NewAnswerCardPage from "./pages/NewAnswerCardPage";
import NewExamPage from "./pages/NewExamPage";
import ReviewPage from "./pages/ReviewPage";
import ScanPage from "./pages/ScanPage";
import StudentsPage from "./pages/StudentsPage";
import TemplateDetailPage from "./pages/TemplateDetailPage";
import TemplatesPage from "./pages/TemplatesPage";

const TEMPLATES_KEY = "answer-sheet-manager.templates";
const EXAMS_KEY = "answer-sheet-manager.exams";
const CLASSES_KEY = "answer-sheet-manager.classes";
type ReviewState = { examId: string; recognition: Recognition; fileName: string };

function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
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
function BottomNav() {
  const navigate = useNavigate();
  const path = window.location.pathname;
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
          className={path.startsWith(to) ? "active" : ""}
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
function DeleteDialog({
  name,
  label,
  onCancel,
  onConfirm,
}: {
  name: string;
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <section className="template-modal delete-modal" role="dialog" aria-modal="true">
        <header>
          <button onClick={onCancel} aria-label="取消删除">
            <X size={21} />
          </button>
          <h2>删除{label}</h2>
          <span />
        </header>
        <p>将删除“{name}”及相关数据，此操作无法撤销。</p>
        <div>
          <button onClick={onCancel}>取消</button>
          <button className="danger-action" onClick={onConfirm}>
            <Trash2 size={18} />
            确认删除
          </button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [templates, setTemplates] = useState(() =>
    load<Array<AnswerCardTemplate & { records?: unknown }>>(TEMPLATES_KEY, []).map(
      ({ records: _records, ...template }) => ({
        ...template,
        candidateNumberLength: template.candidateNumberLength ?? 2,
      }),
    ),
  );
  const [exams, setExams] = useState(() => load<Exam[]>(EXAMS_KEY, []));
  const [classes, setClasses] = useState(() => load<ClassRoster[]>(CLASSES_KEY, []));
  const [review, setReview] = useState<ReviewState | null>(null);
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);
  const [deleteClass, setDeleteClass] = useState<ClassRoster | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<AnswerCardTemplate | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  }, [templates]);
  useEffect(() => {
    localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
  }, [exams]);
  useEffect(() => {
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
  }, [classes]);
  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2200);
  };
  const saveTemplate = (template: AnswerCardTemplate) => {
    setTemplates((current) =>
      current.some((item) => item.id === template.id)
        ? current.map((item) => (item.id === template.id ? template : item))
        : [template, ...current],
    );
    navigate(`/answer-sheets/${template.id}`);
    notify("答题卡已保存");
  };
  const saveEditedTemplate = (template: AnswerCardTemplate) => {
    setTemplates((current) => current.map((item) => (item.id === template.id ? template : item)));
    navigate(`/answer-sheets/${template.id}`);
    notify("答题卡已保存");
  };
  const copyTemplate = (template: AnswerCardTemplate) => {
    setTemplates((current) => [
      {
        ...template,
        id: crypto.randomUUID(),
        name: `${template.name} 副本`,
        answers: [...template.answers],
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    notify("已复制答题卡");
  };
  const scanned = (exam: Exam, recognition: Recognition, fileName: string) => {
    if (!recognition.markerValid || !recognition.studentNumber) {
      notify("未识别完整准考证号，请重新扫描");
      return;
    }
    const student = findStudent(classes, exam.classId, recognition.studentNumber);
    if (!student) {
      notify(`未找到学号 ${recognition.studentNumber} 对应的学生`);
      return;
    }
    setReview({ examId: exam.id, recognition, fileName });
    navigate(`/exams/${exam.id}/review`);
  };
  const saveReview = (exam: Exam, answers: Array<Option | null>, confidence: number[]) => {
    const template = templates.find((item) => item.id === exam.templateId);
    const classroom = classes.find((item) => item.id === exam.classId);
    const studentNumber = review?.recognition.studentNumber;
    const student = findStudent(classes, exam.classId, studentNumber ?? "");
    if (!template || !classroom || !student || answers.some((answer) => answer === null)) {
      notify("识别信息不完整，无法保存成绩");
      return;
    }
    const record = gradeAnswers(
      template,
      student.name,
      review?.fileName ?? "answer-sheet.jpg",
      answers,
      confidence,
      student.studentNumber,
      classroom.name,
    );
    setExams((current) =>
      current.map((item) =>
        item.id === exam.id ? { ...item, records: [...item.records, record] } : item,
      ),
    );
    setReview(null);
    navigate(`/exams/${exam.id}/results`);
    notify("成绩已保存");
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
              onCopy={copyTemplate}
              onSelect={(template) => navigate(`/answer-sheets/${template.id}`)}
            />
          }
        />
        <Route
          path="/answer-sheets/new"
          element={
            <NewAnswerCardPage onSave={saveTemplate} onBack={() => navigate("/answer-sheets")} />
          }
        />
        <Route
          path="/answer-sheets/:id"
          element={
            <TemplateDetailRoute
              templates={templates}
              exams={exams}
              onBack={() => navigate("/answer-sheets")}
              onEdit={(template) => navigate(`/answer-sheets/${template.id}/edit`)}
              onDelete={setDeleteTemplate}
              notify={notify}
            />
          }
        />
        <Route
          path="/answer-sheets/:id/edit"
          element={
            <TemplateEditor
              templates={templates}
              exams={exams}
              onSave={saveEditedTemplate}
              onBack={() => navigate("/answer-sheets")}
            />
          }
        />
        <Route
          path="/exams"
          element={
            <ExamsPage
              exams={exams}
              templates={templates}
              classes={classes}
              onCreate={() => navigate("/exams/new")}
              onSelect={(exam) => navigate(`/exams/${exam.id}`)}
            />
          }
        />
        <Route
          path="/exams/new"
          element={
            <NewExamPage
              templates={templates}
              classes={classes}
              onSave={(exam) => {
                setExams((current) => [exam, ...current]);
                navigate(`/exams/${exam.id}`);
                notify("考试已创建");
              }}
              onBack={() => navigate("/exams")}
            />
          }
        />
        <Route
          path="/exams/:id"
          element={
            <ExamRoute
              exams={exams}
              templates={templates}
              classes={classes}
              onBack={() => navigate("/exams")}
              onScan={(exam) => navigate(`/exams/${exam.id}/scan`)}
              onResults={(exam) => navigate(`/exams/${exam.id}/results`)}
              onDelete={setDeleteExam}
            />
          }
        />
        <Route
          path="/exams/:id/scan"
          element={
            <ExamTemplateRoute exams={exams} templates={templates}>
              {(exam, template) => (
                <ScanPage
                  template={template}
                  onSelect={() => navigate(`/exams/${exam.id}`)}
                  onScanned={(recognition, fileName) => scanned(exam, recognition, fileName)}
                  notify={notify}
                />
              )}
            </ExamTemplateRoute>
          }
        />
        <Route
          path="/exams/:id/review"
          element={
            <ReviewRoute
              exams={exams}
              templates={templates}
              classes={classes}
              review={review}
              onSave={saveReview}
              onCancel={(exam) => {
                setReview(null);
                navigate(`/exams/${exam.id}/scan`);
              }}
            />
          }
        />
        <Route
          path="/exams/:id/results"
          element={
            <ExamTemplateRoute exams={exams} templates={templates}>
              {(exam, template) => (
                <AnalysisPage
                  template={template}
                  records={exam.records}
                  onBack={() => navigate(`/exams/${exam.id}`)}
                />
              )}
            </ExamTemplateRoute>
          }
        />
        <Route
          path="/students"
          element={
            <StudentsPage
              classes={classes}
              onCreate={() => navigate("/students/new")}
              onSelect={(classroom) => navigate(`/students/${classroom.id}`)}
            />
          }
        />
        <Route
          path="/students/new"
          element={
            <ClassEditorPage
              onBack={() => navigate("/students")}
              onSave={(classroom) => {
                setClasses((current) => [...current, classroom]);
                navigate(`/students/${classroom.id}`);
                notify("班级已创建");
              }}
            />
          }
        />
        <Route
          path="/students/:id"
          element={
            <ClassRoute
              classes={classes}
              onBack={() => navigate("/students")}
              onEdit={(classroom) => navigate(`/students/${classroom.id}/edit`)}
              onDelete={setDeleteClass}
            />
          }
        />
        <Route
          path="/students/:id/edit"
          element={
            <ClassEditorRoute
              classes={classes}
              onBack={() => navigate("/students")}
              onSave={(classroom) => {
                setClasses((current) =>
                  current.map((item) => (item.id === classroom.id ? classroom : item)),
                );
                navigate(`/students/${classroom.id}`);
                notify("班级已保存");
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/answer-sheets" replace />} />
      </Routes>
      <BottomNav />
      {deleteTemplate && (
        <DeleteDialog
          name={deleteTemplate.name}
          label="答题卡"
          onCancel={() => setDeleteTemplate(null)}
          onConfirm={() => {
            setTemplates((current) =>
              current.filter((template) => template.id !== deleteTemplate.id),
            );
            setDeleteTemplate(null);
            navigate("/answer-sheets");
            notify("答题卡已删除");
          }}
        />
      )}
      {deleteClass && (
        <DeleteDialog
          name={deleteClass.name}
          label="班级"
          onCancel={() => setDeleteClass(null)}
          onConfirm={() => {
            setClasses((current) => current.filter((item) => item.id !== deleteClass.id));
            setExams((current) => current.filter((exam) => exam.classId !== deleteClass.id));
            setDeleteClass(null);
            navigate("/students");
            notify("班级已删除");
          }}
        />
      )}
      {deleteExam && (
        <DeleteDialog
          name={deleteExam.name}
          label="考试"
          onCancel={() => setDeleteExam(null)}
          onConfirm={() => {
            setExams((current) => current.filter((exam) => exam.id !== deleteExam.id));
            setDeleteExam(null);
            navigate("/exams");
            notify("考试已删除");
          }}
        />
      )}
      <Toast message={message} />
    </div>
  );
}
function TemplateDetailRoute({
  templates,
  exams,
  onBack,
  onEdit,
  onDelete,
  notify,
}: {
  templates: AnswerCardTemplate[];
  exams: Exam[];
  onBack: () => void;
  onEdit: (template: AnswerCardTemplate) => void;
  onDelete: (template: AnswerCardTemplate) => void;
  notify: (text: string) => void;
}) {
  const { id } = useParams();
  const template = templates.find((item) => item.id === id);
  if (!template) return <Navigate to="/answer-sheets" replace />;
  const locked = exams.some((exam) => exam.templateId === template.id && exam.records.length > 0);
  return (
    <TemplateDetailPage
      template={template}
      locked={locked}
      onBack={onBack}
      onEdit={() => onEdit(template)}
      onDelete={() => onDelete(template)}
      notify={notify}
    />
  );
}
function TemplateEditor({
  templates,
  exams,
  onSave,
  onBack,
}: {
  templates: AnswerCardTemplate[];
  exams: Exam[];
  onSave: (template: AnswerCardTemplate) => void;
  onBack: () => void;
}) {
  const { id } = useParams();
  const template = templates.find((item) => item.id === id);
  if (!template) return <Navigate to="/answer-sheets" replace />;
  if (exams.some((exam) => exam.templateId === template.id && exam.records.length))
    return <Navigate to="/answer-sheets" replace />;
  return <NewAnswerCardPage template={template} onSave={onSave} onBack={onBack} />;
}
function ExamRoute({
  exams,
  templates,
  classes,
  onBack,
  onScan,
  onResults,
  onDelete,
}: {
  exams: Exam[];
  templates: AnswerCardTemplate[];
  classes: ClassRoster[];
  onBack: () => void;
  onScan: (exam: Exam) => void;
  onResults: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}) {
  const { id } = useParams();
  const exam = exams.find((item) => item.id === id);
  const template = templates.find((item) => item.id === exam?.templateId);
  const classroom = classes.find((item) => item.id === exam?.classId);
  return exam && template && classroom ? (
    <ExamDetailPage
      exam={exam}
      template={template}
      classroom={classroom}
      onBack={onBack}
      onScan={() => onScan(exam)}
      onResults={() => onResults(exam)}
      onDelete={() => onDelete(exam)}
    />
  ) : (
    <Navigate to="/exams" replace />
  );
}
function ExamTemplateRoute({
  exams,
  templates,
  children,
}: {
  exams: Exam[];
  templates: AnswerCardTemplate[];
  children: (exam: Exam, template: AnswerCardTemplate) => React.ReactNode;
}) {
  const { id } = useParams();
  const exam = exams.find((item) => item.id === id);
  const template = templates.find((item) => item.id === exam?.templateId);
  return exam && template ? children(exam, template) : <Navigate to="/exams" replace />;
}
function ReviewRoute({
  exams,
  templates,
  classes,
  review,
  onSave,
  onCancel,
}: {
  exams: Exam[];
  templates: AnswerCardTemplate[];
  classes: ClassRoster[];
  review: ReviewState | null;
  onSave: (exam: Exam, answers: Array<Option | null>, confidence: number[]) => void;
  onCancel: (exam: Exam) => void;
}) {
  const { id } = useParams();
  const exam = exams.find((item) => item.id === id);
  const template = templates.find((item) => item.id === exam?.templateId);
  const classroom = classes.find((item) => item.id === exam?.classId);
  const student = findStudent(classes, exam?.classId, review?.recognition.studentNumber ?? "");
  return exam && template && classroom && student && review?.examId === exam.id ? (
    <ReviewPage
      template={template}
      recognition={review.recognition}
      fileName={review.fileName}
      className={classroom.name}
      studentNumber={student.studentNumber}
      studentName={student.name}
      onSave={(answers, confidence) => onSave(exam, answers, confidence)}
      onCancel={() => onCancel(exam)}
    />
  ) : (
    <Navigate to="/exams" replace />
  );
}
function ClassRoute({
  classes,
  onBack,
  onEdit,
  onDelete,
}: {
  classes: ClassRoster[];
  onBack: () => void;
  onEdit: (classroom: ClassRoster) => void;
  onDelete: (classroom: ClassRoster) => void;
}) {
  const { id } = useParams();
  const classroom = classes.find((item) => item.id === id);
  return classroom ? (
    <ClassDetailPage
      classroom={classroom}
      onBack={onBack}
      onEdit={() => onEdit(classroom)}
      onDelete={() => onDelete(classroom)}
    />
  ) : (
    <Navigate to="/students" replace />
  );
}
function ClassEditorRoute({
  classes,
  onBack,
  onSave,
}: {
  classes: ClassRoster[];
  onBack: () => void;
  onSave: (classroom: ClassRoster) => void;
}) {
  const { id } = useParams();
  const classroom = classes.find((item) => item.id === id);
  return classroom ? (
    <ClassEditorPage classroom={classroom} onSave={onSave} onBack={onBack} />
  ) : (
    <Navigate to="/students" replace />
  );
}
