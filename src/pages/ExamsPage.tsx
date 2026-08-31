import ListCard from "../components/ListCard";
import PageHeader from "../components/PageHeader";
import { ClipboardPlus, Plus, ScanLine } from "lucide-react";
import { Exam } from "../lib/exam";

type Props = {
  exams: Exam[];
  onCreate: () => void;
  onSelect: (exam: Exam) => void;
};
export default function ExamsPage({ exams, onCreate, onSelect }: Props) {
  return (
    <>
      <PageHeader
        title="考试管理"
        action={
          <button onClick={onCreate} className="create-mini" aria-label="新建考试">
            <Plus size={20} />
          </button>
        }
      />
      <main className="page answerSheets-page">
        {exams.length ? (
          <div className="answer-sheet-list">
            {exams.map((exam) => (
              <ListCard
                key={exam.id}
                leading={<ScanLine size={21} />}
                tags={[exam.classroom.name, exam.answerSheet.name]}
                title={exam.name}
                description={`已阅 ${exam.records.length} 份`}
                onClick={() => onSelect(exam)}
              />
            ))}
          </div>
        ) : (
          <section className="empty-state">
            <ClipboardPlus size={37} />
            <h2>还没有考试</h2>
            <p>选择答题卡和班级后创建考试，扫描成绩会保存到该考试中。</p>
            <button onClick={onCreate}>
              <Plus size={18} />
              新建考试
            </button>
          </section>
        )}
      </main>
    </>
  );
}
