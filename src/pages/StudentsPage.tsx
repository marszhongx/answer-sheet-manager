import ListCard from "../components/ListCard";
import PageHeader from "../components/PageHeader";
import { Plus, UsersRound } from "lucide-react";
import { Classroom } from "../lib/roster";
import { useAppStore } from "../store/appStore";

type Props = {
  onCreate: () => void;
  onSelect: (classroom: Classroom) => void;
};
export default function StudentsPage({ onCreate, onSelect }: Props) {
  const classroomList = useAppStore((state) => state.classroomList);
  const templates = classroomList.filter((item) => item.isTemplate);
  return (
    <>
      <PageHeader
        title="学生管理"
        action={
          <button onClick={onCreate} className="create-mini" aria-label="新建班级">
            <Plus size={20} />
          </button>
        }
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
                onClick={() => onSelect(classroom)}
              />
            ))}
          </div>
        ) : (
          <section className="empty-state">
            <UsersRound size={37} />
            <h2>还没有班级</h2>
            <p>先建立班级和学生学号，扫描准考证号后即可自动关联成绩。</p>
            <button onClick={onCreate}>
              <Plus size={18} />
              新建班级
            </button>
          </section>
        )}
      </main>
    </>
  );
}
