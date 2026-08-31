import PageHeader from "../components/PageHeader";
import { Copy, Download, FilePenLine, Trash2 } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { AnswerSheet, answerSheetSections } from "../lib/omr";
import { useAppStore } from "../store/appStore";

type Props = {
  onBack: () => void;
  onEdit: (answerSheet: AnswerSheet) => void;
  onCopy: (answerSheet: AnswerSheet) => void;
  onPreview: (answerSheet: AnswerSheet) => void;
  onDelete: (answerSheet: AnswerSheet) => void;
};
export default function AnswerSheetDetailPage({
  onBack,
  onEdit,
  onCopy,
  onPreview,
  onDelete,
}: Props) {
  const { id } = useParams();
  const answerSheet = useAppStore((state) => state.answerSheetMap)[id ?? ""];
  if (!answerSheet) return <Navigate to="/answer-sheets" replace />;
  const total = answerSheetSections(answerSheet).reduce(
    (sum, section) => sum + section.questionCount * section.pointsPerQuestion,
    0,
  );
  return (
    <>
      <PageHeader title={answerSheet.name} onBack={onBack} backLabel="返回答题卡列表" />
      <main className="page detail-page">
        <section className="exam-summary">
          <div className="exam-info-row">
            <span>答题卡名称</span>
            <b>{answerSheet.name}</b>
          </div>
          <div className="exam-info-row">
            <span>科目</span>
            <b>{answerSheet.subject}</b>
          </div>
          <div className="exam-info-row">
            <span>题目数量</span>
            <b>{answerSheet.questionCount} 题</b>
          </div>
          <div className="exam-info-row">
            <span>总分</span>
            <b>{total} 分</b>
          </div>
        </section>
        <section className="detail-actions">
          <button onClick={() => onEdit(answerSheet)}>
            <FilePenLine size={19} />
            编辑答题卡
          </button>
          <button onClick={() => onCopy(answerSheet)}>
            <Copy size={19} />
            复制答题卡
          </button>
          <button onClick={() => onPreview(answerSheet)}>
            <Download size={19} />
            预览并下载答题卡
          </button>
          <button className="danger-action" onClick={() => onDelete(answerSheet)}>
            <Trash2 size={19} />
            删除答题卡
          </button>
        </section>
      </main>
    </>
  );
}
