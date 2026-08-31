import { useEffect, useRef, useState } from "react";
import { Check, ClipboardList, LayoutTemplate, Trash2, UsersRound, X } from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { gradeAnswers } from "./lib/grading";
import { AnswerSheet, Option, Recognition } from "./lib/omr";
import { Exam } from "./lib/exam";
import { Classroom } from "./lib/roster";
import AnalysisPage from "./pages/AnalysisPage";
import ClassDetailPage from "./pages/ClassDetailPage";
import ClassEditorPage from "./pages/ClassEditorPage";
import ExamDetailPage from "./pages/ExamDetailPage";
import ExamsPage from "./pages/ExamsPage";
import NewAnswerSheetPage from "./pages/NewAnswerSheetPage";
import NewExamPage from "./pages/NewExamPage";
import ReviewPage from "./pages/ReviewPage";
import ScanPage from "./pages/ScanPage";
import StudentsPage from "./pages/StudentsPage";
import AnswerSheetDetailPage from "./pages/AnswerSheetDetailPage";
import AnswerSheetPreviewPage from "./pages/AnswerSheetPreviewPage";
import AnswerSheetsPage from "./pages/AnswerSheetsPage";

const ANSWER_SHEETS_KEY = "answer-sheet-manager.answerSheets";
const EXAMS_KEY = "answer-sheet-manager.exams";
const CLASSROOMS_KEY = "answer-sheet-manager.classrooms";
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
function stripRecords<T extends object>(answerSheet: T & { records?: unknown }): T {
  const { records: _records, ...rest } = answerSheet;
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
      <section className="answer-sheet-modal delete-modal" role="dialog" aria-modal="true">
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
  const [answerSheets, setAnswerSheets] = useState(() => load<AnswerSheet[]>(ANSWER_SHEETS_KEY, []));
  const [classrooms, setClassrooms] = useState(() => load<Classroom[]>(CLASSROOMS_KEY, []));
  const [exams, setExams] = useState(() => load<Exam[]>(EXAMS_KEY, []));
  const [review, setReview] = useState<ReviewState | null>(null);
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);
  const [deleteClass, setDeleteClass] = useState<Classroom | null>(null);
  const [deleteAnswerSheet, setDeleteAnswerSheet] = useState<AnswerSheet | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const navigate = useNavigate();
  useEffect(() => {
    if (!persist(ANSWER_SHEETS_KEY, answerSheets)) {
      window.setTimeout(() => setMessage("本地存储空间不足，答题卡数据未能保存"), 0);
    }
  }, [answerSheets]);
  useEffect(() => {
    if (!persist(EXAMS_KEY, exams)) {
      window.setTimeout(() => setMessage("本地存储空间不足，考试数据未能保存"), 0);
    }
  }, [exams]);
  useEffect(() => {
    if (!persist(CLASSROOMS_KEY, classrooms)) {
      window.setTimeout(() => setMessage("本地存储空间不足，班级数据未能保存"), 0);
    }
  }, [classrooms]);
  const notify = (text: string) => {
    setMessage(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setMessage(null), 2200);
  };
  const saveAnswerSheet = (answerSheet: AnswerSheet) => {
    setAnswerSheets((current) =>
      current.some((item) => item.id === answerSheet.id)
        ? current.map((item) => (item.id === answerSheet.id ? answerSheet : item))
        : [answerSheet, ...current],
    );
    navigate(`/answer-sheets/${answerSheet.id}`);
    notify("答题卡已保存");
  };
  const saveEditedAnswerSheet = (answerSheet: AnswerSheet) => {
    setAnswerSheets((current) => current.map((item) => (item.id === answerSheet.id ? answerSheet : item)));
    navigate(`/answer-sheets/${answerSheet.id}`);
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
    const answerSheet = exam.answerSheet;
    const classroom = exam.classroom;
    const studentNumber = review?.recognition.studentNumber;
    const student = classroom.students.find((item) => item.studentNumber === studentNumber);
    if (!student || answers.some((answer) => answer === null)) {
      notify("识别信息不完整，无法保存成绩");
      return;
    }
    const record = gradeAnswers(
      answerSheet,
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
            <AnswerSheetsPage
              answerSheets={answerSheets}
              onCreate={() => navigate("/answer-sheets/new")}
              onSelect={(answerSheet) => navigate(`/answer-sheets/${answerSheet.id}`)}
            />
          }
        />
        <Route
          path="/answer-sheets/new"
          element={
            <NewAnswerSheetPage onSave={saveAnswerSheet} onBack={() => navigate("/answer-sheets")} />
          }
        />
        <Route
          path="/answer-sheets/:id/preview"
          element={
            <AnswerSheetPreviewRoute
              answerSheets={answerSheets}
              onBack={() => navigate(-1)}
              notify={notify}
            />
          }
        />
        <Route
          path="/answer-sheets/:id"
          element={
            <AnswerSheetDetailRoute
              answerSheets={answerSheets}
              exams={exams}
              onBack={() => navigate("/answer-sheets")}
              onEdit={(answerSheet) => navigate(`/answer-sheets/${answerSheet.id}/edit`)}
              onCopy={(answerSheet) => {
                const copied = {
                  ...stripRecords(answerSheet),
                  id: crypto.randomUUID(),
                  name: `${answerSheet.name} 副本`,
                  answers: [...answerSheet.answers],
                  createdAt: new Date().toISOString(),
                };
                setAnswerSheets((current) => [copied, ...current]);
                navigate(`/answer-sheets/${copied.id}`);
                notify("已复制答题卡");
              }}
              onPreview={(answerSheet) => navigate(`/answer-sheets/${answerSheet.id}/preview`)}
              onDelete={setDeleteAnswerSheet}
            />
          }
        />
        <Route
          path="/answer-sheets/:id/edit"
          element={
            <AnswerSheetEditor answerSheets={answerSheets} exams={exams} onSave={saveEditedAnswerSheet} />
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
              answerSheets={answerSheets}
              classrooms={classrooms}
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
              answerSheets={answerSheets}
              classrooms={classrooms}
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
          path="/exams/:id/answer-sheet/edit"
          element={
            <ExamAnswerSheetEditorRoute
              exams={exams}
              onSave={(exam, answerSheet) => {
                setExams((current) =>
                  current.map((item) => (item.id === exam.id ? { ...item, answerSheet } : item)),
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
              onEditAnswerSheet={(exam) => navigate(`/exams/${exam.id}/answer-sheet/edit`)}
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
            <ExamAnswerSheetRoute exams={exams}>
              {(exam, answerSheet) => (
                <ScanPage
                  answerSheet={answerSheet}
                  onBack={() => navigate(`/exams/${exam.id}`)}
                  onSelect={() => navigate(`/exams/${exam.id}`)}
                  onScanned={(recognition, fileName) => scanned(exam, recognition, fileName)}
                  notify={notify}
                />
              )}
            </ExamAnswerSheetRoute>
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
            <ExamAnswerSheetRoute exams={exams}>
              {(exam, answerSheet) => (
                <AnalysisPage
                  answerSheet={answerSheet}
                  records={exam.records}
                  onBack={() => navigate(`/exams/${exam.id}`)}
                />
              )}
            </ExamAnswerSheetRoute>
          }
        />
        <Route
          path="/students"
          element={
            <StudentsPage
              classrooms={classrooms}
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
                setClassrooms((current) => [...current, classroom]);
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
              classrooms={classrooms}
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
              classrooms={classrooms}
              onSave={(classroom) => {
                setClassrooms((current) =>
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
      {deleteAnswerSheet && (
        <DeleteDialog
          name={deleteAnswerSheet.name}
          label="答题卡"
          onCancel={() => setDeleteAnswerSheet(null)}
          onConfirm={() => {
            setAnswerSheets((current) =>
              current.filter((answerSheet) => answerSheet.id !== deleteAnswerSheet.id),
            );
            setDeleteAnswerSheet(null);
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
            setClassrooms((current) => current.filter((item) => item.id !== deleteClass.id));
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
function AnswerSheetPreviewRoute({
  answerSheets,
  onBack,
  notify,
}: {
  answerSheets: AnswerSheet[];
  onBack: () => void;
  notify: (text: string) => void;
}) {
  const { id } = useParams();
  const answerSheet = answerSheets.find((item) => item.id === id);
  return answerSheet ? (
    <AnswerSheetPreviewPage answerSheet={answerSheet} onBack={onBack} notify={notify} />
  ) : (
    <Navigate to="/answer-sheets" replace />
  );
}
function AnswerSheetDetailRoute({
  answerSheets,
  exams,
  onBack,
  onEdit,
  onCopy,
  onPreview,
  onDelete,
}: {
  answerSheets: AnswerSheet[];
  exams: Exam[];
  onBack: () => void;
  onEdit: (answerSheet: AnswerSheet) => void;
  onCopy: (answerSheet: AnswerSheet) => void;
  onPreview: (answerSheet: AnswerSheet) => void;
  onDelete: (answerSheet: AnswerSheet) => void;
}) {
  const { id } = useParams();
  const answerSheet = answerSheets.find((item) => item.id === id);
  if (!answerSheet) return <Navigate to="/answer-sheets" replace />;
  const locked = exams.some((exam) => exam.answerSheet.id === answerSheet.id && exam.records.length > 0);
  return (
    <AnswerSheetDetailPage
      answerSheet={answerSheet}
      locked={locked}
      onBack={onBack}
      onEdit={() => onEdit(answerSheet)}
      onCopy={() => onCopy(answerSheet)}
      onPreview={() => onPreview(answerSheet)}
      onDelete={() => onDelete(answerSheet)}
    />
  );
}
function AnswerSheetEditor({
  answerSheets,
  exams,
  onSave,
}: {
  answerSheets: AnswerSheet[];
  exams: Exam[];
  onSave: (answerSheet: AnswerSheet) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const answerSheet = answerSheets.find((item) => item.id === id);
  if (!answerSheet) return <Navigate to="/answer-sheets" replace />;
  if (exams.some((exam) => exam.answerSheet.id === answerSheet.id && exam.records.length))
    return <Navigate to={`/answer-sheets/${answerSheet.id}`} replace />;
  return (
    <NewAnswerSheetPage
      answerSheet={answerSheet}
      onSave={onSave}
      onBack={() => navigate(`/answer-sheets/${answerSheet.id}`)}
    />
  );
}
function ExamEditorRoute({
  exams,
  answerSheets,
  classrooms,
  onSave,
  onBack,
}: {
  exams: Exam[];
  answerSheets: AnswerSheet[];
  classrooms: Classroom[];
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
      answerSheets={answerSheets}
      classrooms={classrooms}
      onSave={onSave}
      onBack={() => onBack(exam)}
    />
  );
}
function ExamAnswerSheetEditorRoute({
  exams,
  onSave,
}: {
  exams: Exam[];
  onSave: (exam: Exam, answerSheet: AnswerSheet) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = exams.find((item) => item.id === id);
  if (!exam) return <Navigate to="/exams" replace />;
  if (exam.records.length) return <Navigate to={`/exams/${exam.id}`} replace />;
  return (
    <NewAnswerSheetPage
      answerSheet={exam.answerSheet}
      onSave={(answerSheet) => onSave(exam, answerSheet)}
      onBack={() => navigate(`/exams/${exam.id}`)}
    />
  );
}
function ExamClassroomEditorRoute({
  exams,
  onSave,
}: {
  exams: Exam[];
  onSave: (exam: Exam, classroom: Classroom) => void;
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
  onEditAnswerSheet,
  onEditClassroom,
  onScan,
  onResults,
  onDelete,
}: {
  exams: Exam[];
  onBack: () => void;
  onEdit: (exam: Exam) => void;
  onEditAnswerSheet: (exam: Exam) => void;
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
      answerSheet={exam.answerSheet}
      classroom={exam.classroom}
      onBack={onBack}
      onEdit={() => onEdit(exam)}
      onEditAnswerSheet={() => onEditAnswerSheet(exam)}
      onEditClassroom={() => onEditClassroom(exam)}
      onScan={() => onScan(exam)}
      onResults={() => onResults(exam)}
      onDelete={() => onDelete(exam)}
    />
  ) : (
    <Navigate to="/exams" replace />
  );
}
function ExamAnswerSheetRoute({
  exams,
  children,
}: {
  exams: Exam[];
  children: (exam: Exam, answerSheet: AnswerSheet) => React.ReactNode;
}) {
  const { id } = useParams();
  const exam = exams.find((item) => item.id === id);
  return exam ? children(exam, exam.answerSheet) : <Navigate to="/exams" replace />;
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
  const answerSheet = exam?.answerSheet;
  const classroom = exam?.classroom;
  const student = classroom?.students.find(
    (item) => item.studentNumber === review?.recognition.studentNumber,
  );
  return exam && answerSheet && classroom && student && review?.examId === exam.id ? (
    <ReviewPage
      answerSheet={answerSheet}
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
  classrooms,
  onBack,
  onEdit,
  onDelete,
}: {
  classrooms: Classroom[];
  onBack: () => void;
  onEdit: (classroom: Classroom) => void;
  onDelete: (classroom: Classroom) => void;
}) {
  const { id } = useParams();
  const classroom = classrooms.find((item) => item.id === id);
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
  classrooms,
  onSave,
}: {
  classrooms: Classroom[];
  onSave: (classroom: Classroom) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const classroom = classrooms.find((item) => item.id === id);
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
