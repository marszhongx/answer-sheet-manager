import { useState } from "react";
import DetailPage from "../components/DetailPage";
import PageHeader from "../components/PageHeader";
import { Copy, Download, FilePenLine, Trash2 } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import DeleteDialog from "../components/DeleteDialog";
import ActionButton, { ActionList } from "../components/ActionButton";
import InfoList, { InfoRow } from "../components/InfoList";
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
  const copy = async () => {
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
    await useAppStore.getState().createAnswerSheet(copied);
    useAppStore.getState().notify("已复制答题卡");
    navigate(`/answer-sheets/${copied.id}`);
  };
  const confirmDelete = async () => {
    await useAppStore.getState().deleteAnswerSheet(answerSheet.id);
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
      <DetailPage>
        <InfoList>
          <InfoRow label="答题卡名称">{answerSheet.name}</InfoRow>
          <InfoRow label="科目">{answerSheet.subject}</InfoRow>
          <InfoRow label="题目数量">{questionCount(answerSheet)} 题</InfoRow>
          <InfoRow label="总分">{total} 分</InfoRow>
        </InfoList>
        <ActionList>
          <ActionButton icon={<FilePenLine size={19} />} onClick={() => navigate(`/answer-sheets/${answerSheet.id}/edit`)}>
            编辑答题卡
          </ActionButton>
          <ActionButton icon={<Copy size={19} />} onClick={copy}>
            复制答题卡
          </ActionButton>
          <ActionButton icon={<Download size={19} />} onClick={() => navigate(`/answer-sheets/${answerSheet.id}/preview`)}>
            预览并下载答题卡
          </ActionButton>
          <ActionButton variant="danger" icon={<Trash2 size={19} />} onClick={() => setConfirming(true)}>
            删除答题卡
          </ActionButton>
        </ActionList>
      </DetailPage>
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
