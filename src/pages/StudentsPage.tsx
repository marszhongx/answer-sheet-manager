import PageHeader from "../components/PageHeader";
import { Plus, UsersRound } from "lucide-react";
import { ClassRoster } from "../lib/roster";

type Props = {
  classes: ClassRoster[];
  onCreate: () => void;
  onSelect: (classroom: ClassRoster) => void;
};
export default function StudentsPage({ classes, onCreate, onSelect }: Props) {
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
      <main className="page templates-page">
        {classes.length ? (
          <div className="template-list">
            {classes.map((classroom) => (
              <button
                className="real-template-card"
                key={classroom.id}
                onClick={() => onSelect(classroom)}
              >
                <span className="exam-icon">
                  <UsersRound size={21} />
                </span>
                <div>
                  <span>班级</span>
                  <h2>{classroom.name}</h2>
                  <p>{classroom.students.length} 名学生</p>
                </div>
              </button>
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
