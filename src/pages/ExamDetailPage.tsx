import PageHeader from "../components/PageHeader";
import { BarChart3, Camera, Trash2 } from "lucide-react";
import { Exam } from "../lib/exam";
import { AnswerCardTemplate } from "../lib/omr";
import { ClassRoster } from "../lib/roster";

type Props = {
  exam: Exam;
  template: AnswerCardTemplate;
  classroom: ClassRoster;
  onBack: () => void;
  onScan: () => void;
  onResults: () => void;
  onDelete: () => void;
};
export default function ExamDetailPage({
  exam,
  template,
  classroom,
  onBack,
  onScan,
  onResults,
  onDelete,
}: Props) {
  return (
    <>
      <PageHeader title={exam.name} onBack={onBack} backLabel="返回考试管理" />
      <main className="page detail-page">
        <section className="exam-summary">
          <b>{template.name}</b>
          <span>
            {template.questionCount} 道题 · 准考证号 {template.candidateNumberLength} 位
          </span>
          <small>{classroom.students.length} 名学生</small>
        </section>
        <section className="detail-actions">
          <button className="primary-action" onClick={onScan}>
            <Camera size={19} />
            扫描答题卡
          </button>
          <button onClick={onResults}>
            <BarChart3 size={19} />
            查看成绩
          </button>
          <button className="danger-action" onClick={onDelete}>
            <Trash2 size={19} />
            删除考试
          </button>
        </section>
      </main>
    </>
  );
}
