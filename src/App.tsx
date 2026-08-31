import { useRef, useState } from "react";
import { Check, ClipboardList, LayoutTemplate, Trash2, UsersRound, X } from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { gradeAnswers } from "./lib/grading";
import { AnswerSheet, Option, Recognition } from "./lib/omr";
import { Exam } from "./lib/exam";
import { Classroom } from "./lib/roster";
import {
  saveAnswerSheetList,
  saveClassroomList,
  saveExamList,
  useAppStore,
} from "./store/appStore";
import AnalysisPage from "./pages/AnalysisPage";
import ClassroomDetailPage from "./pages/ClassroomDetailPage";
import ClassroomEditorPage from "./pages/ClassroomEditorPage";
import ExamDetailPage from "./pages/ExamDetailPage";
import ExamsPage from "./pages/ExamsPage";
import NewAnswerSheetPage from "./pages/NewAnswerSheetPage";
import NewExamPage, { ExamDraft } from "./pages/NewExamPage";
import ReviewPage from "./pages/ReviewPage";
import ScanPage from "./pages/ScanPage";
import StudentsPage from "./pages/StudentsPage";
import AnswerSheetDetailPage from "./pages/AnswerSheetDetailPage";
import AnswerSheetPreviewPage from "./pages/AnswerSheetPreviewPage";
import AnswerSheetsPage from "./pages/AnswerSheetsPage";

type ReviewState = { examId: string; recognition: Recognition; fileName: string };

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

function ExamAnswerSheetEditRoute({
  onSave,
  onBack,
}: {
  onSave: (exam: Exam, answerSheet: AnswerSheet) => void;
  onBack: () => void;
}) {
  const { id } = useParams();
  const exam = useAppStore((state) => state.examMap)[id ?? ""];
  if (!exam) return <Navigate to="/exams" replace />;
  return (
    <NewAnswerSheetPage
      onSave={(answerSheet) => onSave(exam, answerSheet)}
      onBack={onBack}
    />
  );
}
function ExamClassroomEditRoute({
  onSave,
  onBack,
}: {
  onSave: (exam: Exam, classroom: Classroom) => void;
  onBack: () => void;
}) {
  const { id } = useParams();
  const exam = useAppStore((state) => state.examMap)[id ?? ""];
  if (!exam) return <Navigate to="/exams" replace />;
  return (
    <ClassroomEditorPage
      onSave={(classroom) => onSave(exam, classroom)}
      onBack={onBack}
    />
  );
}

export default function App() {
  const [review, setReview] = useState<ReviewState | null>(null);
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);
  const [deleteClassroom, setDeleteClassroom] = useState<Classroom | null>(null);
  const [deleteAnswerSheet, setDeleteAnswerSheet] = useState<AnswerSheet | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const navigate = useNavigate();
  const notify = (text: string) => {
    setMessage(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setMessage(null), 2200);
  };
  const saveAnswerSheet = (answerSheet: AnswerSheet) => {
    const list = useAppStore.getState().answerSheetList;
    saveAnswerSheetList(
      list.some((item) => item.id === answerSheet.id)
        ? list.map((item) => (item.id === answerSheet.id ? answerSheet : item))
        : [answerSheet, ...list],
    );
    navigate(`/answer-sheets/${answerSheet.id}`);
    notify("答题卡已保存");
  };
  const createExam = (draft: ExamDraft) => {
    const { answerSheetMap, classroomMap, answerSheetList, classroomList, examList } =
      useAppStore.getState();
    const sourceSheet = answerSheetMap[draft.answerSheetId];
    const sourceClass = classroomMap[draft.classroomId];
    if (!sourceSheet || !sourceClass) return;
    const sheetCopy = { ...sourceSheet, id: crypto.randomUUID(), isTemplate: false };
    const classCopy = { ...sourceClass, id: crypto.randomUUID(), isTemplate: false };
    saveAnswerSheetList([sheetCopy, ...answerSheetList]);
    saveClassroomList([classCopy, ...classroomList]);
    const exam: Exam = {
      id: draft.id,
      name: draft.name,
      answerSheetId: sheetCopy.id,
      classroomId: classCopy.id,
      records: [],
      createdAt: draft.createdAt,
    };
    saveExamList([exam, ...examList]);
    navigate(`/exams/${exam.id}`);
    notify("考试已创建");
  };
  const updateExam = (draft: ExamDraft) => {
    const list = useAppStore.getState().examList;
    saveExamList(
      list.map((item) =>
        item.id === draft.id
          ? {
              ...item,
              name: draft.name,
              answerSheetId: draft.answerSheetId,
              classroomId: draft.classroomId,
            }
          : item,
      ),
    );
    navigate(`/exams/${draft.id}`);
    notify("考试已保存");
  };
  const updateExamAnswerSheet = (exam: Exam, answerSheet: AnswerSheet) => {
    const list = useAppStore.getState().answerSheetList;
    saveAnswerSheetList(
      list.map((item) => (item.id === answerSheet.id ? answerSheet : item)),
    );
    navigate(`/exams/${exam.id}`);
    notify("考试答题卡已保存");
  };
  const updateExamClassroom = (exam: Exam, classroom: Classroom) => {
    const list = useAppStore.getState().classroomList;
    saveClassroomList(list.map((item) => (item.id === classroom.id ? classroom : item)));
    navigate(`/exams/${exam.id}`);
    notify("考试班级已保存");
  };
  const scanned = (exam: Exam, recognition: Recognition, fileName: string) => {
    if (!recognition.markerValid || !recognition.studentNumber) {
      notify("未识别完整准考证号，请重新扫描");
      return;
    }
    const classroom = useAppStore.getState().classroomMap[exam.classroomId];
    const student = classroom?.students.find(
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
    const { answerSheetMap, classroomMap, examList } = useAppStore.getState();
    const answerSheet = answerSheetMap[exam.answerSheetId];
    const classroom = classroomMap[exam.classroomId];
    if (!answerSheet || !classroom) {
      notify("考试数据缺失，无法保存成绩");
      return;
    }
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
    saveExamList(
      examList.map((item) =>
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
            <AnswerSheetPreviewPage onBack={() => navigate(-1)} notify={notify} />
          }
        />
        <Route
          path="/answer-sheets/:id"
          element={
            <AnswerSheetDetailPage
              onBack={() => navigate("/answer-sheets")}
              onEdit={(answerSheet) => navigate(`/answer-sheets/${answerSheet.id}/edit`)}
              onCopy={(answerSheet) => {
                const copied = {
                  ...stripRecords(answerSheet),
                  id: crypto.randomUUID(),
                  name: `${answerSheet.name} 副本`,
                  answers: [...answerSheet.answers],
                  createdAt: new Date().toISOString(),
                  isTemplate: true,
                };
                const list = useAppStore.getState().answerSheetList;
                saveAnswerSheetList([copied, ...list]);
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
            <NewAnswerSheetPage
              onSave={saveAnswerSheet}
              onBack={() => navigate("/answer-sheets")}
            />
          }
        />
        <Route
          path="/exams"
          element={
            <ExamsPage
              onCreate={() => navigate("/exams/new")}
              onSelect={(exam) => navigate(`/exams/${exam.id}`)}
            />
          }
        />
        <Route
          path="/exams/new"
          element={
            <NewExamPage onSave={createExam} onBack={() => navigate("/exams")} />
          }
        />
        <Route
          path="/exams/:id/edit"
          element={
            <NewExamPage onSave={updateExam} onBack={() => navigate("/exams")} />
          }
        />
        <Route
          path="/exams/:id/answer-sheet/edit"
          element={
            <ExamAnswerSheetEditRoute onSave={updateExamAnswerSheet} onBack={() => navigate(-1)} />
          }
        />
        <Route
          path="/exams/:id/classroom/edit"
          element={
            <ExamClassroomEditRoute onSave={updateExamClassroom} onBack={() => navigate(-1)} />
          }
        />
        <Route
          path="/exams/:id"
          element={
            <ExamDetailPage
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
            <ScanPage
              onBack={() => navigate("/exams")}
              onSelect={() => navigate("/exams")}
              onScanned={scanned}
              notify={notify}
            />
          }
        />
        <Route
          path="/exams/:id/review"
          element={
            <ReviewPage
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
            <AnalysisPage onBack={() => navigate("/exams")} />
          }
        />
        <Route
          path="/students"
          element={
            <StudentsPage
              onCreate={() => navigate("/students/new")}
              onSelect={(classroom) => navigate(`/students/${classroom.id}`)}
            />
          }
        />
        <Route
          path="/students/new"
          element={
            <ClassroomEditorPage
              onBack={() => navigate("/students")}
              onSave={(classroom) => {
                const list = useAppStore.getState().classroomList;
                saveClassroomList([...list, classroom]);
                navigate(`/students/${classroom.id}`);
                notify("班级已创建");
              }}
            />
          }
        />
        <Route
          path="/students/:id"
          element={
            <ClassroomDetailPage
              onBack={() => navigate("/students")}
              onEdit={(classroom) => navigate(`/students/${classroom.id}/edit`)}
              onDelete={setDeleteClassroom}
            />
          }
        />
        <Route
          path="/students/:id/edit"
          element={
            <ClassroomEditorPage
              onBack={() => navigate("/students")}
              onSave={(classroom) => {
                const list = useAppStore.getState().classroomList;
                saveClassroomList(
                  list.map((item) => (item.id === classroom.id ? classroom : item)),
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
            const list = useAppStore.getState().answerSheetList;
            saveAnswerSheetList(
              list.filter((item) => item.id !== deleteAnswerSheet.id),
            );
            setDeleteAnswerSheet(null);
            navigate("/answer-sheets");
            notify("答题卡已删除");
          }}
        />
      )}
      {deleteClassroom && (
        <DeleteDialog
          name={deleteClassroom.name}
          label="班级"
          onCancel={() => setDeleteClassroom(null)}
          onConfirm={() => {
            const list = useAppStore.getState().classroomList;
            saveClassroomList(list.filter((item) => item.id !== deleteClassroom.id));
            setDeleteClassroom(null);
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
            const { examList, answerSheetList, classroomList } = useAppStore.getState();
            saveExamList(examList.filter((exam) => exam.id !== deleteExam.id));
            saveAnswerSheetList(
              answerSheetList.filter((item) => item.id !== deleteExam.answerSheetId),
            );
            saveClassroomList(
              classroomList.filter((item) => item.id !== deleteExam.classroomId),
            );
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
