import { useState } from "react";
import PageHeader from "../components/PageHeader";
import StudentTable from "../components/StudentTable";
import { FilePenLine, Trash2, UsersRound } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import DeleteDialog from "../components/DeleteDialog";
import { useAppStore } from "../store/appStore";

export default function ClassroomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const classroom = useAppStore((state) => state.classroomMap)[id ?? ""];
  const [confirming, setConfirming] = useState(false);
  if (!classroom) return <Navigate to="/students" replace />;
  const confirmDelete = () => {
    useAppStore.getState().deleteClassroom(classroom.id);
    useAppStore.getState().notify("班级已删除");
    navigate("/students");
  };
  return (
    <>
      <PageHeader
        title={classroom.name}
        onBack={() => navigate("/students")}
        backLabel="返回班级管理"
      />
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
          <button onClick={() => navigate(`/students/${classroom.id}/edit`)}>
            <FilePenLine size={19} />
            编辑班级
          </button>
          <button className="danger-action" onClick={() => setConfirming(true)}>
            <Trash2 size={19} />
            删除班级
          </button>
        </section>
      </main>
      {confirming && (
        <DeleteDialog
          name={classroom.name}
          label="班级"
          onCancel={() => setConfirming(false)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
