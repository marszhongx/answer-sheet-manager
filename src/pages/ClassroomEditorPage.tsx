import { useState } from "react";
import FormSection from "../components/FormSection";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import StudentRosterTable from "../components/StudentRosterTable";
import SubmitButton from "../components/SubmitButton";
import { Check } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Classroom, Student } from "../lib/roster";
import { useAppStore } from "../store/appStore";

export default function ClassroomEditorPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const classroomMap = useAppStore((state) => state.classroomMap);
  const examMap = useAppStore((state) => state.examMap);
  const classroom =
    classroomMap[id ?? ""] ?? classroomMap[examMap[id ?? ""]?.classroomId ?? ""];
  const [name, setName] = useState(classroom?.name ?? "");
  const [students, setStudents] = useState<Student[]>(
    classroom?.students ?? [{ id: crypto.randomUUID(), name: "", studentNumber: "" }],
  );
  const editing = Boolean(classroom);
  const save = async () => {
    if (!name.trim()) return;
    const next: Classroom = {
      id: classroom?.id ?? crypto.randomUUID(),
      name: name.trim(),
      students: students.filter((student) => student.name.trim() && student.studentNumber),
      isTemplate: classroom?.isTemplate ?? true,
    };
    const store = useAppStore.getState();
    const examId = pathname.startsWith("/exams/") ? id : undefined;
    if (examId) {
      await store.updateClassroom(next);
      store.notify("考试班级已保存");
      navigate(`/exams/${examId}`);
      return;
    }
    if (store.classroomMap[next.id]) {
      await store.updateClassroom(next);
      store.notify("班级已保存");
    } else {
      await store.createClassroom(next);
      store.notify("班级已创建");
    }
    navigate(`/students/${next.id}`);
  };

  return (
    <>
      <PageHeader
        title={editing ? "编辑班级" : "新建班级"}
        onBack={() => navigate(pathname.startsWith("/exams/") ? `/exams/${id}` : "/students")}
        backLabel="返回"
      />
      <main className="page">
        <FormSection>
          <label>
            班级名称
            <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          </label>
        </FormSection>
        <StudentRosterTable students={students} onChange={setStudents} />
        <SubmitButton icon={<Check size={19} />} disabled={!name.trim()} onClick={save}>
          {editing ? "保存班级" : "创建班级"}
        </SubmitButton>
      </main>
    </>
  );
}
