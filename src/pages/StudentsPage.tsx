import AddButton from "../components/AddButton";
import CardList from "../components/CardList";
import EmptyState from "../components/EmptyState";
import ListCard from "../components/ListCard";
import Page from "../components/Page";
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
        title="班级管理"
        action={<AddButton label="新建班级" onClick={() => navigate("/students/new")} />}
      />
      <Page>
        {templates.length ? (
          <CardList>
            {templates.map((classroom) => (
              <ListCard
                key={classroom.id}
                leading={<UsersRound size={21} />}
                title={classroom.name}
                description={`${classroom.students.length} 名学生`}
                onClick={() => navigate(`/students/${classroom.id}`)}
              />
            ))}
          </CardList>
        ) : (
          <EmptyState
            icon={<UsersRound size={37} />}
            title="还没有班级"
            description="先建立班级和学生学号，扫描准考证号后即可自动关联成绩。"
            actionLabel="新建班级"
            onAction={() => navigate("/students/new")}
          />
        )}
      </Page>
    </>
  );
}
