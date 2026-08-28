import ListCard from "../components/ListCard";
import PageHeader from "../components/PageHeader";
import { FileText, Plus } from "lucide-react";
import { AnswerCardTemplate } from "../lib/omr";
import EmptyState from "./EmptyState";

type Props = {
  templates: AnswerCardTemplate[];
  onCreate: () => void;
  onSelect: (template: AnswerCardTemplate) => void;
};
export default function TemplatesPage({ templates, onCreate, onSelect }: Props) {
  return (
    <>
      <PageHeader
        title="答题卡"
        action={
          <button onClick={onCreate} className="create-mini" aria-label="新建答题卡">
            <Plus size={20} />
          </button>
        }
      />
      <main className="page templates-page">
        {templates.length === 0 ? (
          <EmptyState onCreate={onCreate} />
        ) : (
          <div className="template-list">
            {templates.map((template) => (
              <ListCard
                key={template.id}
                leading={<FileText size={22} />}
                tags={[template.subject]}
                title={template.name}
                description={`${template.questionCount} 道单选题 · 每题 5 分`}
                onClick={() => onSelect(template)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
