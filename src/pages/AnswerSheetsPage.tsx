import ListCard from "../components/ListCard";
import PageHeader from "../components/PageHeader";
import { FileText, Plus } from "lucide-react";
import { AnswerSheet, questionPoints } from "../lib/omr";
import { useAppStore } from "../store/appStore";
import EmptyState from "./EmptyState";

type Props = {
  onCreate: () => void;
  onSelect: (answerSheet: AnswerSheet) => void;
};
export default function AnswerSheetsPage({ onCreate, onSelect }: Props) {
  const answerSheetList = useAppStore((state) => state.answerSheetList);
  const templates = answerSheetList.filter((item) => item.isTemplate);
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
      <main className="page answerSheets-page">
        {templates.length === 0 ? (
          <EmptyState onCreate={onCreate} />
        ) : (
          <div className="answer-sheet-list">
            {templates.map((answerSheet) => (
              <ListCard
                key={answerSheet.id}
                leading={<FileText size={22} />}
                tags={[answerSheet.subject]}
                title={answerSheet.name}
                description={`${answerSheet.questionCount} 道单选题 · 共 ${questionPoints(answerSheet).reduce((sum, point) => sum + point, 0)} 分`}
                onClick={() => onSelect(answerSheet)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
