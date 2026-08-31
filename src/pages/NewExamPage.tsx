import { useState } from "react";
import FormSection from "../components/FormSection";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";
import { Check } from "lucide-react";
import { AnswerSheet } from "../lib/omr";
import { Classroom } from "../lib/roster";
import { Exam } from "../lib/exam";

type Props = {
  exam?: Exam;
  answerSheets: AnswerSheet[];
  classrooms: Classroom[];
  onSave: (exam: Exam) => void;
  onBack: () => void;
};
export default function NewExamPage({ exam, answerSheets, classrooms, onSave, onBack }: Props) {
  const [name, setName] = useState(exam?.name ?? "");
  const [answerSheetId, setAnswerSheetId] = useState(exam?.answerSheet.id ?? answerSheets[0]?.id ?? "");
  const [classroomId, setClassroomId] = useState(exam?.classroom.id ?? classrooms[0]?.id ?? "");
  const editing = Boolean(exam);
  const selectedAnswerSheet =
    answerSheets.find((answerSheet) => answerSheet.id === answerSheetId) ?? exam?.answerSheet;
  const selectedClassroom =
    classrooms.find((classroom) => classroom.id === classroomId) ?? exam?.classroom;
  const canSave = Boolean(name.trim() && selectedAnswerSheet && selectedClassroom);
  const save = () => {
    if (!selectedAnswerSheet || !selectedClassroom) return;
    onSave({
      id: exam?.id ?? crypto.randomUUID(),
      name: name.trim(),
      answerSheet: structuredClone(selectedAnswerSheet),
      classroom: structuredClone(selectedClassroom),
      records: exam?.records ?? [],
      createdAt: exam?.createdAt ?? new Date().toISOString(),
    });
  };
  return (
    <>
      <PageHeader
        title={editing ? "编辑考试" : "新建考试"}
        onBack={onBack}
        backLabel="返回考试管理"
      />
      <main className="page new-answer-sheet-page">
        <FormSection>
          <label>
            考试名称
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：第一单元测验"
              autoFocus
            />
          </label>
          <label>
            答题卡
            <Select
              value={answerSheetId}
              onChange={setAnswerSheetId}
              options={answerSheets.map((answerSheet) => ({ value: answerSheet.id, label: answerSheet.name }))}
              ariaLabel="答题卡"
            />
          </label>
          <label>
            参考班级
            <Select
              value={classroomId}
              onChange={setClassroomId}
              options={classrooms.map((classroom) => ({ value: classroom.id, label: classroom.name }))}
              ariaLabel="参考班级"
            />
          </label>
        </FormSection>
        <button className="create-answer-sheet-button" disabled={!canSave} onClick={save}>
          <Check size={19} />
          {editing ? "保存考试" : "创建考试"}
        </button>
        {(!answerSheets.length || !classrooms.length) && (
          <p className="real-note">请先创建答题卡，并在班级管理中创建班级。</p>
        )}
      </main>
    </>
  );
}
