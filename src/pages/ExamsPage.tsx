import PageHeader from "../components/PageHeader";
import { BarChart3, ClipboardPlus, Plus, ScanLine } from "lucide-react";
import { AnswerCardTemplate } from "../lib/omr";
import { Exam } from "../lib/exam";
import { ClassRoster } from "../lib/roster";

type Props = {
  exams: Exam[];
  templates: AnswerCardTemplate[];
  classes: ClassRoster[];
  onCreate: () => void;
  onSelect: (exam: Exam) => void;
};
export default function ExamsPage({ exams, templates, classes, onCreate, onSelect }: Props) {
  const templateName = (id: string) =>
    templates.find((template) => template.id === id)?.name ?? "已删除答题卡";
  const className = (id: string) => classes.find((item) => item.id === id)?.name ?? "未分班";
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
      <main className="page templates-page">
        {exams.length ? (
          <div className="template-list">
            {exams.map((exam) => (
              <button className="real-template-card" key={exam.id} onClick={() => onSelect(exam)}>
                <span className="exam-icon">
                  <ScanLine size={21} />
                </span>
                <div>
                  <span>{className(exam.classId)}</span>
                  <h2>{exam.name}</h2>
                  <p>
                    {templateName(exam.templateId)} · 已阅 {exam.records.length} 份
                  </p>
                </div>
                <BarChart3 size={19} />
              </button>
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
