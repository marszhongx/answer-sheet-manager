import PageHeader from "../components/PageHeader";
import StudentTable from "../components/StudentTable";
import { FilePenLine, Trash2, UsersRound } from "lucide-react";
import { Classroom } from "../lib/roster";

type Props = {
  classroom: Classroom;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ClassDetailPage({ classroom, onBack, onEdit, onDelete }: Props) {
  return (
    <>
      <PageHeader title={classroom.name} onBack={onBack} backLabel="返回班级管理" />
      <main className="page detail-page">
        <section className="class-info-panel">
          <div className="exam-info-row">
            <span>班级名称</span>
            <b>{classroom.name}</b>
          </div>
          <div className="exam-info-row">
            <span>学生人数</span>
            <b>{classroom.students.length} 人</b>
          </div>
          {classroom.students.length ? (
            <StudentTable students={classroom.students} />
          ) : (
            <section className="analysis-empty">
              <UsersRound size={34} />
              <h2>还没有学生</h2>
              <p>编辑班级后可以添加学生。</p>
            </section>
          )}
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
      </main>
    </>
  );
}
