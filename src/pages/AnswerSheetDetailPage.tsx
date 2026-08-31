import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { Copy, Download, FilePenLine, Trash2 } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import DeleteDialog from "../components/DeleteDialog";
import { answerSheetSections, questionCount } from "../lib/omr";
import { useAppStore } from "../store/appStore";

export default function AnswerSheetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const answerSheet = useAppStore((state) => state.answerSheetMap)[id ?? ""];
  const [confirming, setConfirming] = useState(false);
  if (!answerSheet) return <Navigate to="/answer-sheets" replace />;
  const total = answerSheetSections(answerSheet).reduce(
    (sum, section) => sum + section.questions.length * section.pointsPerQuestion,
    0,
  );
  const copy = () => {
    const { records: _omit, ...clean } = answerSheet as typeof answerSheet & {
      records?: unknown;
    };
    const copied = {
      ...clean,
      id: crypto.randomUUID(),
      name: `${answerSheet.name} 副本`,
      sections: answerSheet.sections.map((section) => ({
        ...section,
        questions: section.questions.map((question) => ({ ...question })),
      })),
      createdAt: new Date().toISOString(),
      isTemplate: true,
    };
    useAppStore.getState().createAnswerSheet(copied);
    useAppStore.getState().notify("已复制答题卡");
    navigate(`/answer-sheets/${copied.id}`);
  };
  const confirmDelete = () => {
    useAppStore.getState().deleteAnswerSheet(answerSheet.id);
    useAppStore.getState().notify("答题卡已删除");
    navigate("/answer-sheets");
  };
  return (
    <>
      <PageHeader
        title={answerSheet.name}
        onBack={() => navigate("/answer-sheets")}
        backLabel="返回答题卡列表"
      />
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
            <b>{questionCount(answerSheet)} 题</b>
          </div>
          <div className="exam-info-row">
            <span>总分</span>
            <b>{total} 分</b>
          </div>
        </section>
        <section className="detail-actions">
          <button onClick={() => navigate(`/answer-sheets/${answerSheet.id}/edit`)}>
            <FilePenLine size={19} />
            编辑答题卡
          </button>
          <button onClick={copy}>
            <Copy size={19} />
            复制答题卡
          </button>
          <button onClick={() => navigate(`/answer-sheets/${answerSheet.id}/preview`)}>
            <Download size={19} />
            预览并下载答题卡
          </button>
          <button className="danger-action" onClick={() => setConfirming(true)}>
            <Trash2 size={19} />
            删除答题卡
          </button>
        </section>
      </main>
      {confirming && (
        <DeleteDialog
          name={answerSheet.name}
          label="答题卡"
          onCancel={() => setConfirming(false)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
