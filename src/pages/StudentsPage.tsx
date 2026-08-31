import ListCard from "../components/ListCard";
import PageHeader from "../components/PageHeader";
import { Plus, UsersRound } from "lucide-react";
import { Classroom } from "../lib/roster";

type Props = {
  classrooms: Classroom[];
  onCreate: () => void;
  onSelect: (classroom: Classroom) => void;
};
export default function StudentsPage({ classrooms, onCreate, onSelect }: Props) {
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
        {classrooms.length ? (
          <div className="answer-sheet-list">
            {classrooms.map((classroom) => (
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
