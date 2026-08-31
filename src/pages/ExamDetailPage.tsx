import { useEffect, useRef, useState } from "react";
import PageHeader from "../components/PageHeader";
import { BarChart3, Camera, Download, FilePenLine, Trash2 } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import DeleteDialog from "../components/DeleteDialog";
import { drawA4PrintPage } from "../lib/omr";
import { useAppStore } from "../store/appStore";

export default function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const examMap = useAppStore((state) => state.examMap);
  const answerSheetMap = useAppStore((state) => state.answerSheetMap);
  const classroomMap = useAppStore((state) => state.classroomMap);
  const exam = examMap[id ?? ""];
  const answerSheet = exam ? answerSheetMap[exam.answerSheetId] : undefined;
  const classroom = exam ? classroomMap[exam.classroomId] : undefined;
  const ref = useRef<HTMLCanvasElement>(null);
  const [printable, setPrintable] = useState(true);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (answerSheet && ref.current) setPrintable(drawA4PrintPage(ref.current, answerSheet));
  }, [answerSheet]);
  if (!exam || !answerSheet || !classroom) return <Navigate to="/exams" replace />;
  const download = () => {
    if (!ref.current || !printable) return;
    const link = document.createElement("a");
    link.href = ref.current.toDataURL("image/png");
    link.download = `${exam.name}-答题卡.png`;
    link.click();
  };
  const confirmDelete = () => {
    useAppStore.getState().deleteExam(exam.id);
    useAppStore.getState().deleteAnswerSheet(exam.answerSheetId);
    useAppStore.getState().deleteClassroom(exam.classroomId);
    useAppStore.getState().notify("考试已删除");
    navigate("/exams");
  };
  return (
    <>
      <PageHeader title={exam.name} onBack={() => navigate("/exams")} backLabel="返回考试管理" />
      <main className="page detail-page">
        {printable ? (
          <div className="print-preview a4-preview">
            <canvas ref={ref} />
          </div>
        ) : (
          <div className="print-preview-error">答题卡内容超出 A4 纸张范围，无法预览。</div>
        )}
        <section className="exam-summary">
          <div className="exam-info-row">
            <span>考试名称</span>
            <b>{exam.name}</b>
          </div>
          <div className="exam-info-row">
            <span>答题卡</span>
            <b>{answerSheet.name}</b>
          </div>
          <div className="exam-info-row">
            <span>班级</span>
            <b>{classroom.name}</b>
          </div>
          <div className="exam-info-row">
            <span>已阅答卷</span>
            <b>{exam.scanRecords.length} 份</b>
          </div>
        </section>
        <section className="detail-actions">
          <button onClick={() => navigate(`/exams/${exam.id}/edit`)} disabled={exam.scanRecords.length > 0}>
            <FilePenLine size={19} />
            编辑考试
          </button>
          <button onClick={() => navigate(`/exams/${exam.id}/answer-sheet/edit`)} disabled={exam.scanRecords.length > 0}>
            <FilePenLine size={19} />
            编辑考试答题卡
          </button>
          <button onClick={() => navigate(`/exams/${exam.id}/classroom/edit`)} disabled={exam.scanRecords.length > 0}>
            <FilePenLine size={19} />
            编辑考试班级
          </button>
          <button onClick={download} disabled={!printable}>
            <Download size={19} />
            下载考试答题卡
          </button>
          <button className="primary-action" onClick={() => navigate(`/exams/${exam.id}/scan`)}>
            <Camera size={19} />
            扫描答题卡
          </button>
          <button onClick={() => navigate(`/exams/${exam.id}/results`)}>
            <BarChart3 size={19} />
            查看成绩
          </button>
          <button className="danger-action" onClick={() => setConfirming(true)}>
            <Trash2 size={19} />
            删除考试
          </button>
        </section>
      </main>
      {confirming && (
        <DeleteDialog
          name={exam.name}
          label="考试"
          onCancel={() => setConfirming(false)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
