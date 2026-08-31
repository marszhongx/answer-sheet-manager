import { useEffect, useRef, useState } from "react";
import PageHeader from "../components/PageHeader";
import { BarChart3, Camera, Download, FilePenLine, Trash2 } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import DeleteDialog from "../components/DeleteDialog";
import ActionButton, { ActionList } from "../components/ActionButton";
import InfoList, { InfoRow } from "../components/InfoList";
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
  const confirmDelete = async () => {
    await useAppStore.getState().deleteExam(exam.id);
    await useAppStore.getState().deleteAnswerSheet(exam.answerSheetId);
    await useAppStore.getState().deleteClassroom(exam.classroomId);
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
        <InfoList>
          <InfoRow label="考试名称">{exam.name}</InfoRow>
          <InfoRow label="答题卡">{answerSheet.name}</InfoRow>
          <InfoRow label="班级">{classroom.name}</InfoRow>
          <InfoRow label="已阅答卷">{exam.scanRecords.length} 份</InfoRow>
        </InfoList>
        <ActionList>
          <ActionButton
            icon={<FilePenLine size={19} />}
            disabled={exam.scanRecords.length > 0}
            onClick={() => navigate(`/exams/${exam.id}/edit`)}
          >
            编辑考试
          </ActionButton>
          <ActionButton
            icon={<FilePenLine size={19} />}
            disabled={exam.scanRecords.length > 0}
            onClick={() => navigate(`/exams/${exam.id}/answer-sheet/edit`)}
          >
            编辑考试答题卡
          </ActionButton>
          <ActionButton
            icon={<FilePenLine size={19} />}
            disabled={exam.scanRecords.length > 0}
            onClick={() => navigate(`/exams/${exam.id}/classroom/edit`)}
          >
            编辑考试班级
          </ActionButton>
          <ActionButton icon={<Download size={19} />} disabled={!printable} onClick={download}>
            下载考试答题卡
          </ActionButton>
          <ActionButton variant="primary" icon={<Camera size={19} />} onClick={() => navigate(`/exams/${exam.id}/scan`)}>
            扫描答题卡
          </ActionButton>
          <ActionButton icon={<BarChart3 size={19} />} onClick={() => navigate(`/exams/${exam.id}/results`)}>
            查看成绩
          </ActionButton>
          <ActionButton variant="danger" icon={<Trash2 size={19} />} onClick={() => setConfirming(true)}>
            删除考试
          </ActionButton>
        </ActionList>
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
