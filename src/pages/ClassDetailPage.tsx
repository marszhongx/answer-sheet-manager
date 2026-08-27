import PageHeader from "../components/PageHeader";
import { FilePenLine, Trash2, UsersRound } from "lucide-react";
import { ClassRoster } from "../lib/roster";

type Props = {
  classroom: ClassRoster;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ClassDetailPage({ classroom, onBack, onEdit, onDelete }: Props) {
  return (
    <>
      <PageHeader title={classroom.name} onBack={onBack} backLabel="返回班级管理" />
      <main className="page detail-page">
        <section className="exam-summary">
          <b>{classroom.name}</b>
          <span>{classroom.students.length} 名学生</span>
        </section>
        <section className="detail-actions">
          <button onClick={onEdit}>
            <FilePenLine size={19} />
            编辑班级
          </button>
          <button className="danger-action" onClick={onDelete}>
            <Trash2 size={19} />
            删除班级
          </button>
        </section>
        {classroom.students.length ? (
          <div className="student-list">
            {classroom.students.map((student) => (
              <div key={student.id}>
                <span>{student.name}</span>
                <b>{student.studentNumber}</b>
              </div>
            ))}
          </div>
        ) : (
          <section className="analysis-empty">
            <UsersRound size={34} />
            <h2>还没有学生</h2>
            <p>编辑班级后可以添加学生。</p>
          </section>
        )}
      </main>
    </>
  );
}
