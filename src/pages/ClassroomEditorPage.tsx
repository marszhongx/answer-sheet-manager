import { useState } from "react";
import FormSection from "../components/FormSection";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import StudentRosterTable from "../components/StudentRosterTable";
import { Check } from "lucide-react";
import { useParams } from "react-router-dom";
import { Classroom, Student } from "../lib/roster";
import { useAppStore } from "../store/appStore";

type Props = {
  onSave: (classroom: Classroom) => void;
  onBack: () => void;
};

export default function ClassroomEditorPage({ onSave, onBack }: Props) {
  const { id } = useParams();
  const classroomMap = useAppStore((state) => state.classroomMap);
  const examMap = useAppStore((state) => state.examMap);
  const classroom =
    classroomMap[id ?? ""] ?? classroomMap[examMap[id ?? ""]?.classroomId ?? ""];
  const [name, setName] = useState(classroom?.name ?? "");
  const [students, setStudents] = useState<Student[]>(
    classroom?.students ?? [{ id: crypto.randomUUID(), name: "", studentNumber: "" }],
  );
  const editing = Boolean(classroom);
  const save = () => {
    if (!name.trim()) return;
    onSave({
      id: classroom?.id ?? crypto.randomUUID(),
      name: name.trim(),
      students: students.filter((student) => student.name.trim() && student.studentNumber),
      isTemplate: classroom?.isTemplate ?? true,
    });
  };

  return (
    <>
      <PageHeader
        title={editing ? "编辑班级" : "新建班级"}
        onBack={onBack}
        backLabel="返回班级管理"
      />
      <main className="page new-answer-sheet-page">
        <FormSection>
          <label>
            班级名称
            <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          </label>
        </FormSection>
        <StudentRosterTable students={students} onChange={setStudents} />
        <button className="create-answer-sheet-button" disabled={!name.trim()} onClick={save}>
          <Check size={19} />
          {editing ? "保存班级" : "创建班级"}
        </button>
      </main>
    </>
  );
}
