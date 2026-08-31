import { useEffect, useRef, useState } from "react";
import PageHeader from "../components/PageHeader";
import { BarChart3, Camera, Download, FilePenLine, Trash2 } from "lucide-react";
import { Exam } from "../lib/exam";
import { AnswerSheet, drawA4PrintPage } from "../lib/omr";
import { Classroom } from "../lib/roster";

type Props = {
  exam: Exam;
  answerSheet: AnswerSheet;
  classroom: Classroom;
  onBack: () => void;
  onEdit: () => void;
  onEditAnswerSheet: () => void;
  onEditClassroom: () => void;
  onScan: () => void;
  onResults: () => void;
  onDelete: () => void;
};
export default function ExamDetailPage({
  exam,
  answerSheet,
  classroom,
  onBack,
  onEdit,
  onEditAnswerSheet,
  onEditClassroom,
  onScan,
  onResults,
  onDelete,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [printable, setPrintable] = useState(true);
  useEffect(() => {
    if (ref.current) setPrintable(drawA4PrintPage(ref.current, answerSheet));
  }, [answerSheet]);
  const download = () => {
    if (!ref.current || !printable) return;
    const link = document.createElement("a");
    link.href = ref.current.toDataURL("image/png");
    link.download = `${exam.name}-答题卡.png`;
    link.click();
  };
  return (
    <>
      <PageHeader title={exam.name} onBack={onBack} backLabel="返回考试管理" />
      <main className="page detail-page">
        {printable ? (
          <div className="print-preview a4-preview">
            <canvas ref={ref} />
          </div>
        ) : (
          <div className="print-preview-error">答题卡内容超出 A4 纸张范围，无法预览和下载。</div>
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
            <b>{exam.records.length} 份</b>
          </div>
        </section>
        <section className="detail-actions">
          <button onClick={onEdit} disabled={exam.records.length > 0}>
            <FilePenLine size={19} />
            编辑考试
          </button>
          <button onClick={onEditAnswerSheet} disabled={exam.records.length > 0}>
            <FilePenLine size={19} />
            编辑考试答题卡
          </button>
          <button onClick={onEditClassroom} disabled={exam.records.length > 0}>
            <FilePenLine size={19} />
            编辑考试班级
          </button>
          <button onClick={download} disabled={!printable}>
            <Download size={19} />
            下载考试答题卡
          </button>
          <button className="primary-action" onClick={onScan}>
            <Camera size={19} />
            扫描答题卡
          </button>
          <button onClick={onResults}>
            <BarChart3 size={19} />
            查看成绩
          </button>
          <button className="danger-action" onClick={onDelete}>
            <Trash2 size={19} />
            删除考试
          </button>
        </section>
      </main>
    </>
  );
}
