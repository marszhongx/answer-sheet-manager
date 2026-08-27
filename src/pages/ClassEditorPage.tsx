import { useState } from "react";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import { Check, Plus, UsersRound } from "lucide-react";
import { ClassRoster, Student } from "../lib/roster";

type Props = {
  classroom?: ClassRoster;
  onSave: (classroom: ClassRoster) => void;
  onBack: () => void;
};

export default function ClassEditorPage({ classroom, onSave, onBack }: Props) {
  const [name, setName] = useState(classroom?.name ?? "");
  const [students, setStudents] = useState<Student[]>(classroom?.students ?? []);
  const [studentName, setStudentName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const editing = Boolean(classroom);
  const addStudent = () => {
    if (!studentName.trim() || !studentNumber) return;
    setStudents((current) => [
      ...current,
      { id: crypto.randomUUID(), name: studentName.trim(), studentNumber },
    ]);
    setStudentName("");
    setStudentNumber("");
  };
  const save = () => {
    if (!name.trim()) return;
    onSave({ id: classroom?.id ?? crypto.randomUUID(), name: name.trim(), students });
  };

  return (
    <>
      <PageHeader
        title={editing ? "编辑班级" : "新建班级"}
        onBack={onBack}
        backLabel="返回班级管理"
      />
      <main className="page new-answer-card-page">
        <div className="form-block">
          <label>
            班级名称
            <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          </label>
        </div>
        <section className="student-form">
          <label>
            学生姓名
            <Input value={studentName} onChange={(event) => setStudentName(event.target.value)} />
          </label>
          <label>
            学号
            <Input
              value={studentNumber}
              inputMode="numeric"
              onChange={(event) => setStudentNumber(event.target.value.replace(/\D/g, ""))}
              placeholder="例如：88"
            />
          </label>
          <button onClick={addStudent} disabled={!studentName.trim() || !studentNumber}>
            <Plus size={18} />
            添加学生
          </button>
        </section>
        {students.length ? (
          <div className="student-list">
            {students.map((student) => (
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
            <p>录入学生姓名和学号后，扫描准考证号即可自动识别。</p>
          </section>
        )}
        <button className="create-template-button" disabled={!name.trim()} onClick={save}>
          <Check size={19} />
          {editing ? "保存班级" : "创建班级"}
        </button>
      </main>
    </>
  );
}
