import { useEffect, useRef, useState } from "react";
import PageHeader from "../components/PageHeader";
import { Download, FilePenLine, Trash2 } from "lucide-react";
import { AnswerCardTemplate, drawA4PrintPage, templateSections } from "../lib/omr";

type Props = {
  template: AnswerCardTemplate;
  locked: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  notify: (text: string) => void;
};
export default function TemplateDetailPage({
  template,
  locked,
  onBack,
  onEdit,
  onDelete,
  notify,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [printable, setPrintable] = useState(true);
  useEffect(() => {
    if (ref.current) setPrintable(drawA4PrintPage(ref.current, template));
  }, [template]);
  const download = () => {
    if (!ref.current || !printable) return;
    const link = document.createElement("a");
    link.href = ref.current.toDataURL("image/png");
    link.download = `${template.name.replace(/[\\/:*?"<>|]/g, "_")}.png`;
    link.click();
    notify("答题卡已下载");
  };
  const total = templateSections(template).reduce(
    (sum, section) => sum + section.questionCount * section.pointsPerQuestion,
    0,
  );
  return (
    <>
      <PageHeader title={template.name} onBack={onBack} backLabel="返回答题卡列表" />
      <main className="page detail-page">
        {printable ? (
          <div className="print-preview a4-preview">
            <canvas ref={ref} />
          </div>
        ) : (
          <div className="print-preview-error">答题卡内容超出 A4 纸张范围，无法预览和下载。</div>
        )}
        <section className="detail-actions">
          <button onClick={onEdit} disabled={locked}>
            <FilePenLine size={19} />
            {locked ? "已有成绩，不能编辑" : "编辑答题卡"}
          </button>
          <button onClick={download} disabled={!printable}>
            <Download size={19} />
            下载答题卡
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
