import PageHeader from "../components/PageHeader";
import StudentTable from "../components/StudentTable";
import { FilePenLine, Trash2, UsersRound } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { Classroom } from "../lib/roster";
import { useAppStore } from "../store/appStore";

type Props = {
  onBack: () => void;
  onEdit: (classroom: Classroom) => void;
  onDelete: (classroom: Classroom) => void;
};

export default function ClassroomDetailPage({ onBack, onEdit, onDelete }: Props) {
  const { id } = useParams();
  const classroom = useAppStore((state) => state.classroomMap)[id ?? ""];
  if (!classroom) return <Navigate to="/students" replace />;
  return (
    <>
      <PageHeader title={classroom.name} onBack={onBack} backLabel="返回班级管理" />
      <main className="page detail-page">
        <section className="classroom-info-panel">
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
          <button onClick={() => onEdit(classroom)}>
            <FilePenLine size={19} />
            编辑班级
          </button>
          <button className="danger-action" onClick={() => onDelete(classroom)}>
            <Trash2 size={19} />
            删除班级
          </button>
        </section>
      </main>
    </>
  );
}
