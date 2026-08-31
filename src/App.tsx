import { useEffect, useRef, useState } from "react";
import { Check, ClipboardList, LayoutTemplate, Trash2, UsersRound, X } from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { gradeAnswers } from "./lib/grading";
import { AnswerCardTemplate, Option, Recognition } from "./lib/omr";
import { Exam } from "./lib/exam";
import { ClassRoster } from "./lib/roster";
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
import AnswerCardPreviewPage from "./pages/AnswerCardPreviewPage";
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
function persist(key: string, data: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
function stripRecords<T extends object>(template: T & { records?: unknown }): T {
  const { records: _records, ...rest } = template;
  return rest as T;
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
  const [templates, setTemplates] = useState(() => load<AnswerCardTemplate[]>(TEMPLATES_KEY, []));
  const [classes, setClasses] = useState(() => load<ClassRoster[]>(CLASSES_KEY, []));
  const [exams, setExams] = useState(() => load<Exam[]>(EXAMS_KEY, []));
  const [review, setReview] = useState<ReviewState | null>(null);
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);
  const [deleteClass, setDeleteClass] = useState<ClassRoster | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<AnswerCardTemplate | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const navigate = useNavigate();
  useEffect(() => {
    if (!persist(TEMPLATES_KEY, templates)) {
      window.setTimeout(() => setMessage("本地存储空间不足，答题卡数据未能保存"), 0);
    }
  }, [templates]);
  useEffect(() => {
    if (!persist(EXAMS_KEY, exams)) {
      window.setTimeout(() => setMessage("本地存储空间不足，考试数据未能保存"), 0);
    }
  }, [exams]);
  useEffect(() => {
    if (!persist(CLASSES_KEY, classes)) {
      window.setTimeout(() => setMessage("本地存储空间不足，班级数据未能保存"), 0);
    }
  }, [classes]);
  const notify = (text: string) => {
    setMessage(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setMessage(null), 2200);
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
  const scanned = (exam: Exam, recognition: Recognition, fileName: string) => {
    if (!recognition.markerValid || !recognition.studentNumber) {
      notify("未识别完整准考证号，请重新扫描");
      return;
    }
    const student = exam.classroom.students.find(
      (item) => item.studentNumber === recognition.studentNumber,
    );
    if (!student) {
      notify(`未找到学号 ${recognition.studentNumber} 对应的学生`);
      return;
    }
    setReview({ examId: exam.id, recognition, fileName });
    navigate(`/exams/${exam.id}/review`);
  };
  const saveReview = (exam: Exam, answers: Array<Option | null>, confidence: number[]) => {
    const template = exam.template;
    const classroom = exam.classroom;
    const studentNumber = review?.recognition.studentNumber;
    const student = classroom.students.find((item) => item.studentNumber === studentNumber);
    if (!student || answers.some((answer) => answer === null)) {
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
    const existing = exam.records.some((item) => item.studentNumber === studentNumber);
    setExams((current) =>
      current.map((item) =>
        item.id === exam.id
          ? {
              ...item,
              records: existing
                ? item.records.map((existingRecord) =>
                    existingRecord.studentNumber === studentNumber ? record : existingRecord,
                  )
                : [...item.records, record],
            }
          : item,
      ),
    );
    setReview(null);
    navigate(`/exams/${exam.id}/results`);
    notify(existing ? "已更新该学生成绩" : "成绩已保存");
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
          path="/answer-sheets/:id/preview"
          element={
            <AnswerCardPreviewRoute
              templates={templates}
              onBack={() => navigate(-1)}
              notify={notify}
            />
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
              onCopy={(template) => {
                const copied = {
                  ...stripRecords(template),
                  id: crypto.randomUUID(),
                  name: `${template.name} 副本`,
                  answers: [...template.answers],
                  createdAt: new Date().toISOString(),
                };
                setTemplates((current) => [copied, ...current]);
                navigate(`/answer-sheets/${copied.id}`);
                notify("已复制答题卡");
              }}
              onPreview={(template) => navigate(`/answer-sheets/${template.id}/preview`)}
              onDelete={setDeleteTemplate}
            />
          }
        />
        <Route
          path="/answer-sheets/:id/edit"
          element={
            <TemplateEditor templates={templates} exams={exams} onSave={saveEditedTemplate} />
          }
        />
        <Route
          path="/exams"
          element={
            <ExamsPage
              exams={exams}
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
          path="/exams/:id/edit"
          element={
            <ExamEditorRoute
              exams={exams}
              templates={templates}
              classes={classes}
              onSave={(exam) => {
                setExams((current) => current.map((item) => (item.id === exam.id ? exam : item)));
                navigate(`/exams/${exam.id}`);
                notify("考试已保存");
              }}
              onBack={(exam) => navigate(`/exams/${exam.id}`)}
            />
          }
        />
        <Route
          path="/exams/:id/template/edit"
          element={
            <ExamTemplateEditorRoute
              exams={exams}
              onSave={(exam, template) => {
                setExams((current) =>
                  current.map((item) => (item.id === exam.id ? { ...item, template } : item)),
                );
                navigate(`/exams/${exam.id}`);
                notify("考试答题卡已保存");
              }}
            />
          }
        />
        <Route
          path="/exams/:id/classroom/edit"
          element={
            <ExamClassroomEditorRoute
              exams={exams}
              onSave={(exam, classroom) => {
                setExams((current) =>
                  current.map((item) => (item.id === exam.id ? { ...item, classroom } : item)),
                );
                navigate(`/exams/${exam.id}`);
                notify("考试班级已保存");
              }}
            />
          }
        />
        <Route
          path="/exams/:id"
          element={
            <ExamRoute
              exams={exams}
              onBack={() => navigate("/exams")}
              onEdit={(exam) => navigate(`/exams/${exam.id}/edit`)}
              onEditTemplate={(exam) => navigate(`/exams/${exam.id}/template/edit`)}
              onEditClassroom={(exam) => navigate(`/exams/${exam.id}/classroom/edit`)}
              onScan={(exam) => navigate(`/exams/${exam.id}/scan`)}
              onResults={(exam) => navigate(`/exams/${exam.id}/results`)}
              onDelete={setDeleteExam}
            />
          }
        />
        <Route
          path="/exams/:id/scan"
          element={
            <ExamTemplateRoute exams={exams}>
              {(exam, template) => (
                <ScanPage
                  template={template}
                  onBack={() => navigate(`/exams/${exam.id}`)}
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
            <ExamTemplateRoute exams={exams}>
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
function AnswerCardPreviewRoute({
  templates,
  onBack,
  notify,
}: {
  templates: AnswerCardTemplate[];
  onBack: () => void;
  notify: (text: string) => void;
}) {
  const { id } = useParams();
  const template = templates.find((item) => item.id === id);
  return template ? (
    <AnswerCardPreviewPage template={template} onBack={onBack} notify={notify} />
  ) : (
    <Navigate to="/answer-sheets" replace />
  );
}
function TemplateDetailRoute({
  templates,
  exams,
  onBack,
  onEdit,
  onCopy,
  onPreview,
  onDelete,
}: {
  templates: AnswerCardTemplate[];
  exams: Exam[];
  onBack: () => void;
  onEdit: (template: AnswerCardTemplate) => void;
  onCopy: (template: AnswerCardTemplate) => void;
  onPreview: (template: AnswerCardTemplate) => void;
  onDelete: (template: AnswerCardTemplate) => void;
}) {
  const { id } = useParams();
  const template = templates.find((item) => item.id === id);
  if (!template) return <Navigate to="/answer-sheets" replace />;
  const locked = exams.some((exam) => exam.template.id === template.id && exam.records.length > 0);
  return (
    <TemplateDetailPage
      template={template}
      locked={locked}
      onBack={onBack}
      onEdit={() => onEdit(template)}
      onCopy={() => onCopy(template)}
      onPreview={() => onPreview(template)}
      onDelete={() => onDelete(template)}
    />
  );
}
function TemplateEditor({
  templates,
  exams,
  onSave,
}: {
  templates: AnswerCardTemplate[];
  exams: Exam[];
  onSave: (template: AnswerCardTemplate) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const template = templates.find((item) => item.id === id);
  if (!template) return <Navigate to="/answer-sheets" replace />;
  if (exams.some((exam) => exam.template.id === template.id && exam.records.length))
    return <Navigate to={`/answer-sheets/${template.id}`} replace />;
  return (
    <NewAnswerCardPage
      template={template}
      onSave={onSave}
      onBack={() => navigate(`/answer-sheets/${template.id}`)}
    />
  );
}
function ExamEditorRoute({
  exams,
  templates,
  classes,
  onSave,
  onBack,
}: {
  exams: Exam[];
  templates: AnswerCardTemplate[];
  classes: ClassRoster[];
  onSave: (exam: Exam) => void;
  onBack: (exam: Exam) => void;
}) {
  const { id } = useParams();
  const exam = exams.find((item) => item.id === id);
  if (!exam) return <Navigate to="/exams" replace />;
  if (exam.records.length) return <Navigate to={`/exams/${exam.id}`} replace />;
  return (
    <NewExamPage
      exam={exam}
      templates={templates}
      classes={classes}
      onSave={onSave}
      onBack={() => onBack(exam)}
    />
  );
}
function ExamTemplateEditorRoute({
  exams,
  onSave,
}: {
  exams: Exam[];
  onSave: (exam: Exam, template: AnswerCardTemplate) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = exams.find((item) => item.id === id);
  if (!exam) return <Navigate to="/exams" replace />;
  if (exam.records.length) return <Navigate to={`/exams/${exam.id}`} replace />;
  return (
    <NewAnswerCardPage
      template={exam.template}
      onSave={(template) => onSave(exam, template)}
      onBack={() => navigate(`/exams/${exam.id}`)}
    />
  );
}
function ExamClassroomEditorRoute({
  exams,
  onSave,
}: {
  exams: Exam[];
  onSave: (exam: Exam, classroom: ClassRoster) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = exams.find((item) => item.id === id);
  if (!exam) return <Navigate to="/exams" replace />;
  if (exam.records.length) return <Navigate to={`/exams/${exam.id}`} replace />;
  return (
    <ClassEditorPage
      classroom={exam.classroom}
      onSave={(classroom) => onSave(exam, classroom)}
      onBack={() => navigate(`/exams/${exam.id}`)}
    />
  );
}
function ExamRoute({
  exams,
  onBack,
  onEdit,
  onEditTemplate,
  onEditClassroom,
  onScan,
  onResults,
  onDelete,
}: {
  exams: Exam[];
  onBack: () => void;
  onEdit: (exam: Exam) => void;
  onEditTemplate: (exam: Exam) => void;
  onEditClassroom: (exam: Exam) => void;
  onScan: (exam: Exam) => void;
  onResults: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}) {
  const { id } = useParams();
  const exam = exams.find((item) => item.id === id);
  return exam ? (
    <ExamDetailPage
      exam={exam}
      template={exam.template}
      classroom={exam.classroom}
      onBack={onBack}
      onEdit={() => onEdit(exam)}
      onEditTemplate={() => onEditTemplate(exam)}
      onEditClassroom={() => onEditClassroom(exam)}
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
  children,
}: {
  exams: Exam[];
  children: (exam: Exam, template: AnswerCardTemplate) => React.ReactNode;
}) {
  const { id } = useParams();
  const exam = exams.find((item) => item.id === id);
  return exam ? children(exam, exam.template) : <Navigate to="/exams" replace />;
}
function ReviewRoute({
  exams,
  review,
  onSave,
  onCancel,
}: {
  exams: Exam[];
  review: ReviewState | null;
  onSave: (exam: Exam, answers: Array<Option | null>, confidence: number[]) => void;
  onCancel: (exam: Exam) => void;
}) {
  const { id } = useParams();
  const exam = exams.find((item) => item.id === id);
  const template = exam?.template;
  const classroom = exam?.classroom;
  const student = classroom?.students.find(
    (item) => item.studentNumber === review?.recognition.studentNumber,
  );
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
  onSave,
}: {
  classes: ClassRoster[];
  onSave: (classroom: ClassRoster) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const classroom = classes.find((item) => item.id === id);
  return classroom ? (
    <ClassEditorPage
      classroom={classroom}
      onSave={onSave}
      onBack={() => navigate(`/students/${classroom.id}`)}
    />
  ) : (
    <Navigate to="/students" replace />
  );
}
