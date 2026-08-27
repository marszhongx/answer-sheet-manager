import { useEffect, useRef } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { AnswerCardTemplate, drawAnswerCard } from "../lib/omr";
import EmptyState from "./EmptyState";

type Props = {
  templates: AnswerCardTemplate[];
  onCreate: () => void;
  onSelect: (template: AnswerCardTemplate) => void;
};
function CardPreview({ template }: { template: AnswerCardTemplate }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawAnswerCard(ref.current, template);
  }, [template]);
  return <canvas ref={ref} className="card-preview" />;
}
export default function TemplatesPage({ templates, onCreate, onSelect }: Props) {
  return (
    <>
      <header className="page-top">
        <div>
          <h1>答题卡</h1>
          <p>只识别本系统生成的标准答题卡</p>
        </div>
        <button onClick={onCreate} className="create-mini" aria-label="新建答题卡">
          <Plus size={20} />
        </button>
      </header>
      <main className="page templates-page">
        {templates.length === 0 ? (
          <EmptyState onCreate={onCreate} />
        ) : (
          <div className="template-list">
            {templates.map((template) => (
              <button
                className="real-template-card"
                onClick={() => onSelect(template)}
                key={template.id}
              >
                <CardPreview template={template} />
                <div>
                  <span>{template.subject}</span>
                  <h2>{template.name}</h2>
                  <p>{template.questionCount} 道单选题 · 每题 5 分</p>
                  <small>点击编辑、打印或开始扫描</small>
                </div>
                <ChevronRight size={19} />
              </button>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
