import AddButton from "../components/AddButton";
import EmptyState from "../components/EmptyState";
import ListCard from "../components/ListCard";
import PageHeader from "../components/PageHeader";
import { UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";

export default function StudentsPage() {
  const navigate = useNavigate();
  const classroomList = useAppStore((state) => state.classroomList);
  const templates = classroomList.filter((item) => item.isTemplate);
  return (
    <>
      <PageHeader
        title="学生管理"
        action={<AddButton label="新建班级" onClick={() => navigate("/students/new")} />}
      />
      <main className="page answerSheets-page">
        {templates.length ? (
          <div className="answer-sheet-list">
            {templates.map((classroom) => (
              <ListCard
                key={classroom.id}
                leading={<UsersRound size={21} />}
                title={classroom.name}
                description={`${classroom.students.length} 名学生`}
                onClick={() => navigate(`/students/${classroom.id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<UsersRound size={37} />}
            title="还没有班级"
            description="先建立班级和学生学号，扫描准考证号后即可自动关联成绩。"
            actionLabel="新建班级"
            onAction={() => navigate("/students/new")}
          />
        )}
      </main>
    </>
  );
}
