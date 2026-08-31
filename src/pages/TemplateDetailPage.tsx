import PageHeader from "../components/PageHeader";
import { Copy, Download, FilePenLine, Trash2 } from "lucide-react";
import { AnswerCardTemplate, templateSections } from "../lib/omr";

type Props = {
  template: AnswerCardTemplate;
  locked: boolean;
  onBack: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onPreview: () => void;
  onDelete: () => void;
};
export default function TemplateDetailPage({
  template,
  locked,
  onBack,
  onEdit,
  onCopy,
  onPreview,
  onDelete,
}: Props) {
  const total = templateSections(template).reduce(
    (sum, section) => sum + section.questionCount * section.pointsPerQuestion,
    0,
  );
  return (
    <>
      <PageHeader title={template.name} onBack={onBack} backLabel="返回答题卡列表" />
      <main className="page detail-page">
        <section className="exam-summary">
          <div className="exam-info-row">
            <span>答题卡名称</span>
            <b>{template.name}</b>
          </div>
          <div className="exam-info-row">
            <span>科目</span>
            <b>{template.subject}</b>
          </div>
          <div className="exam-info-row">
            <span>题目数量</span>
            <b>{template.questionCount} 题</b>
          </div>
          <div className="exam-info-row">
            <span>总分</span>
            <b>{total} 分</b>
          </div>
        </section>
        <section className="detail-actions">
          <button onClick={onEdit} disabled={locked}>
            <FilePenLine size={19} />
            编辑答题卡
          </button>
          <button onClick={onCopy}>
            <Copy size={19} />
            复制答题卡
          </button>
          <button onClick={onPreview}>
            <Download size={19} />
            预览并下载答题卡
          </button>
          <button className="danger-action" onClick={onDelete}>
            <Trash2 size={19} />
            删除答题卡
          </button>
        </section>
      </main>
    </>
  );
}
